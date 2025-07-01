import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "../users/models/user.model";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UsersService } from "../users/users.service";
import { SigninUserDto } from "../users/dto/signin-user.dto";
import * as bcrypt from "bcrypt";
import { Request, Response } from "express";
import { MailService } from "../mail/mail.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService
  ) {}
  private async generateTokens(user: User) {
    const payload = {
      id: user.id,
      is_active: user.is_active,
      is_premium: user.is_premium,
    };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.ACCESS_TOKEN_KEY,
        expiresIn: process.env.ACCESS_TOKEN_TIME,
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.REFRESH_TOKEN_KEY,
        expiresIn: process.env.REFRESH_TOKEN_TIME,
      }),
    ]);
    return {
      accessToken,
      refreshToken,
    };
  }
  async signup(createUserDto: CreateUserDto) {
    const candidate = await this.usersService.findUserByEmail(
      createUserDto.email
    );
    if (candidate) {
      throw new ConflictException("User already exists");
    }
    const newUser = await this.usersService.create(createUserDto);
    try {
      await this.mailService.sendMail(newUser);
    } catch (error) {
      console.log(error);
      throw new ServiceUnavailableException(`While sending email error`);
    }
    return { message: `Royxatdan otdingiz , Akkauntni tasdiqlang` };
  }

  async signin(signinUserDto: SigninUserDto, res: Response) {
    const user = await this.usersService.findUserByEmail(signinUserDto.email);
    if (!user) {
      throw new UnauthorizedException("Password or Email incorrect");
    }
    const validPassword = await bcrypt.compare(
      signinUserDto.password,
      user.password
    );

    if (!validPassword) {
      throw new UnauthorizedException("Password or Email incorrect");
    }
    const { accessToken, refreshToken } = await this.generateTokens(user);

    user.refresh_token = await bcrypt.hash(refreshToken, 7);
    await user.save();
    res.cookie("refreshToken", refreshToken, {
      maxAge: +process.env.COOKIE_TIME!,
      httpOnly: true,
    });

    return { message: "You signed in successfully", id: user.id, accessToken };
  }

  async refresh(req: Request, res: Response) {
    const token = req.cookies["refreshToken"];
    if (!token) {
      throw new UnauthorizedException("Please sign in first");
    }

    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.REFRESH_TOKEN_KEY,
      });
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException("Invalid or expired refresh token");
    }

    const user = await this.usersService.findOne(payload.id);
    if (!user || !user.refresh_token) {
      throw new UnauthorizedException("User not found or not signed in");
    }

    const isTokenValid = await bcrypt.compare(token, user.refresh_token);
    if (!isTokenValid) {
      throw new UnauthorizedException("Refresh token does not match");
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);
    user.refresh_token = await bcrypt.hash(refreshToken, 7);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: +process.env.COOKIE_TIME!,
    });

    return {
      message: "Tokens refreshed successfully",
      accessToken,
    };
  }

  async logout(refreshToken: string, res: Response) {
    let userData: any;
    try {
      userData = await this.jwtService.verify(refreshToken, {
        secret: process.env.REFRESH_TOKEN_KEY,
      });
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error);
    }

    if (!userData) {
      throw new ForbiddenException("User not found");
    }
    await this.usersService.updateRefreshToken(userData.id, "");

    res.clearCookie("refreshToken");
    return { message: "Logged out" };
  }

  async activate(activationLink: string) {
    const user = await this.usersService.findByActivationLink(activationLink);
    if (!user) {
      throw new UnauthorizedException("Activation link is invalid");
    }

    if (user.is_active) {
      return { message: "Account is already activated" };
    }

    user.is_active = true;
    await user.save();

    return { message: "Your account has been successfully activated" };
  }
  async refreshToken(
    userId: number,
    refreshTokenFromCookie: string,
    res: Response
  ) {
    const decodedToken = await this.jwtService.decode(refreshTokenFromCookie);

    if (userId !== decodedToken["id"]) {
      throw new ForbiddenException("You have no permission");
    }

    const user = await this.usersService.findOne(userId);
    if (!user || !user.refresh_token) {
      throw new NotFoundException("User not found or no refresh token");
    }

    const tokenMatch = await bcrypt.compare(
      refreshTokenFromCookie,
      user.refresh_token
    );
    if (!tokenMatch) {
      throw new ForbiddenException("Refresh token does not match");
    }

    const { accessToken, refreshToken } = await this.generateTokens(user);

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 7);
    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    res.cookie("refreshToken", refreshToken, {
      maxAge: Number(process.env.COOKIE_TIME),
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return {
      message: "Tokens refreshed successfully",
      userId: user.id,
      accessToken,
    };
  }
}
