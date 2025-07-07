import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { SequelizeModule } from "@nestjs/sequelize";

// import { join } from "path";
import { UsersModule } from "./users/users.module";
import { User } from "./users/models/user.model";
import { AuthModule } from "./auth/auth.module";
import { MailModule } from "./mail/mail.module";
import { TelegrafModule } from "nestjs-telegraf";
import { BOT_NAME } from "./app.constants";
import { BotModule } from "./bot/bot.module";
import { Bot } from "./bot/models/bot.model";
import { Otp } from "./users/models/otp.model";
import { Library } from "./bot/library/models/library.model";

@Module({
  imports: [
    TelegrafModule.forRootAsync({
      botName: BOT_NAME,
      useFactory: () => ({
        token: process.env.BOT_TOKEN!,
        middlewares: [],
        include: [BotModule],
      }),
    }),

    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    // ServeStaticModul.forRoot({ rootPath: join(__dirname, "..", "static") }),
    SequelizeModule.forRoot({
      dialect: "postgres",
      host: process.env.PG_HOST,
      port: Number(process.env.PG_PORT),
      username: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DB,
      models: [User, Bot, Otp, Library],
      autoLoadModels: true,
      logging: false,
      sync: { alter: true }, //force
    }),
    UsersModule,
    AuthModule,
    MailModule,
    BotModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
