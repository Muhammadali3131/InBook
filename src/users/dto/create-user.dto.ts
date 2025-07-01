import { IsPhoneNumber } from "class-validator";

export class CreateUserDto {
  full_name: string;
  email: string;
  @IsPhoneNumber("UZ")
  phone: string;
  password: string;
  confirm_password: string;
  gender: string;
  birth_year: number;
}
