import { IsPhoneNumber } from "class-validator";

export class VerifyOtpDto {
  @IsPhoneNumber("UZ")
  phone: string;
  otp: string;
  verification_key: string;
}
