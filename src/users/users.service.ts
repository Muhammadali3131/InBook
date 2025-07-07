import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { InjectModel } from "@nestjs/sequelize";
import { User } from "./models/user.model";
import * as bcrypt from "bcrypt";
import { PhoneUserDto } from "./dto/phone-user.dto";
import * as otpGenerator from "otp-generator";
import { BotService } from "../bot/bot.service";
import { Otp } from "./models/otp.model";
import { AddMinutesToDate } from "../common/helpers/addMinutes";
import { decode, encode } from "../common/helpers/crypto";
import { VerifyOtpDto } from "./dto/verify-otp.dto";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private readonly userModel: typeof User,
    @InjectModel(Otp) private readonly otpModel: typeof Otp,
    private readonly botService: BotService
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, confirm_password } = createUserDto;
    if (password !== confirm_password) {
      throw new BadRequestException("Passwords do not match.");
    }
    const hashed_password = await bcrypt.hash(password, 7);
    const newUser = await this.userModel.create({
      ...createUserDto,
      password: hashed_password,
    });

    return newUser;
  }

  async findAll() {
    return await this.userModel.findAll();
  }

  async findOne(id: number) {
    return await this.userModel.findByPk(id);
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const updatedData = await this.userModel.update(updateUserDto, {
      where: { id },
      returning: true,
    });

    return updatedData[1][0];
  }

  async remove(id: number) {
    const user = await this.userModel.findByPk(id);

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await user.destroy();
    return { message: `User with ID ${id} has been removed` };
  }
  async findUserByEmail(email: string) {
    return await this.userModel.findOne({ where: { email } });
  }
  async findByActivationLink(link: string): Promise<User | null> {
    return this.userModel.findOne({ where: { activation_link: link } });
  }
  async updateRefreshToken(id: number, refresh_token: string) {
    const updatedUser = await this.userModel.update(
      { refresh_token },
      { where: { id } }
    );
    return updatedUser;
  }

  async newOtp(phoneUserDto: PhoneUserDto) {
    const phone_number = phoneUserDto.phone;
    const otp = otpGenerator.generate(4, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    const isSend = await this.botService.sendOtp(phone_number, otp);
    if (!isSend) {
      throw new BadRequestException("Avval botdan ro'yxatdan o'ting");
    }

    const now = new Date();
    const expiration_time = AddMinutesToDate(now, 5);
    await this.otpModel.destroy({ where: { phone_number } });
    const dbOtp = await this.otpModel.create({
      otp,
      expiration_time,
      phone_number,
    });

    const details = {
      timestamp: now,
      phone_number,
      otp_id: dbOtp.id,
    };

    const encodedData = await encode(JSON.stringify(details));

    return {
      message: "OTP botga yuborildi",
      verification_key: encodedData,
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { phone, verification_key, otp } = verifyOtpDto;
    const decodedData = await decode(verification_key);
    const details = JSON.parse(decodedData);

    if (details.phone_number != phone) {
      throw new BadRequestException("OTP bu telefon raqamga yuborilmagan");
    }

    const resultOtp = await this.otpModel.findOne({
      where: { id: details.otp_id },
    });

    if (resultOtp == null) {
      throw new BadRequestException("Bunday OTP mavjud emas");
    }

    if (resultOtp.verified) {
      throw new BadRequestException("Bu OTP avval tekshirilgan");
    }

    if (resultOtp.expiration_time < new Date()) {
      throw new BadRequestException("Bu OTPnig vaqti o'tib ketgan");
    }

    if (otp != resultOtp.otp) {
      throw new BadRequestException("OTP noto'g'ri");
    }

    const user = await this.userModel.update(
      {
        is_premium: true,
      },
      {
        where: { phone },
        returning: true,
      }
    );

    if (!user[1][0]) {
      throw new BadRequestException("Bunday foydalanuvchi yo'q");
    }

    resultOtp.verified = true;
    await resultOtp.save();

    return {
      message: "Siz premium user bo'ldingiz",
      user: user[1][0],
    };
  }
}
