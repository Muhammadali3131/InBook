import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/sequelize";
import { Bot } from "../models/bot.model";
import { InjectBot } from "nestjs-telegraf";
import { BOT_NAME } from "../../app.constants";
import { Context, Markup, Telegraf } from "telegraf";
import { Library } from "./models/library.model";

@Injectable()
export class LibraryService {
  constructor(
    @InjectModel(Bot) private readonly botModel: typeof Bot,
    @InjectModel(Library) private readonly libraryModel: typeof Library,
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>
  ) {}

  async onLibrary(ctx: Context) {
    try {
      await ctx.replyWithHTML("Kerakli menuni tanlang:", {
        ...Markup.keyboard([
          ["Yangi kutubxona qo'shish", "Barcha kutubxonalar"],
        ]).resize(),
      });
    } catch (error) {
      console.log(`Error on Library: `, error);
    }
  }

  async addNewLibrary(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        await ctx.replyWithHTML(`Siz avval ro'yxatdan o'tmagansiz!`, {
          ...Markup.removeKeyboard(),
        });
      } else {
        await this.libraryModel.create({
          user_id: user_id!,
          last_state: "name",
        });
      }

      await ctx.replyWithHTML("Yangi kutubxona nomini kiriting:", {
        ...Markup.removeKeyboard(),
      });
    } catch (error) {
      console.log(`Error on Library: `, error);
    }
  }

  async showAllLibraries(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const user = await this.botModel.findByPk(user_id);
      if (!user) {
        await ctx.replyWithHTML(`Siz avval ro'yxatdan o'tmagansiz!`, {
          ...Markup.removeKeyboard(),
        });
      } else {
        const libraries = await this.libraryModel.findAll({
          where: { last_state: "finish" },
        });

        if (libraries.length == 0) {
          await ctx.replyWithHTML(`Birorta kutubxona kiritilmagan!`, {
            ...Markup.keyboard([
              ["Yangi kutubxona qo'shish", "Barcha kutubxonalar"],
            ]).resize(),
          });
        } else {
          libraries.forEach(async (library) => {
            await ctx.replyWithHTML(
              `<b>Nomi:</b> ${library.name}\n<b>Manzili:</b> ${library.address}\n<b>Telefoni:</b> ${library.phone_number}`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [
                      {
                        text: "Lokatsiyasi ko'rish",
                        callback_data: `loclib_${library.id}`,
                      },
                      {
                        text: "O'chirish",
                        callback_data: `dellib_${library.id}`,
                      },
                    ],
                  ],
                },
              }
            );
          });
        }
      }
    } catch (error) {
      console.log(`Error on showAllLibrary: `, error);
    }
  }

  async deleteLibrary(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const lib_id = contextAction.split("_")[1];

      await this.libraryModel.destroy({ where: { id: lib_id } });
      // await ctx.replyWithHTML("Kutubxona o'chirildi", {
      //   ...Markup.keyboard([
      //     ["Yangi kutubxona qo'shish", "Barcha kutubxonalar"],
      //   ]).resize(),
      // });
      await ctx.editMessageText("Kutubxona o'chirildi");
    } catch (error) {
      console.log(`Error on deleteLibrary: `, error);
    }
  }

  async showLocationLibrary(ctx: Context) {
    try {
      const contextAction = ctx.callbackQuery!["data"];
      const lib_id = contextAction.split("_")[1];

      const contextMessage = ctx.callbackQuery!["message"];
      console.log(contextMessage);
      await ctx.deleteMessage(contextMessage?.message_id);

      const library = await this.libraryModel.findByPk(lib_id);

      await ctx.replyWithLocation(
        Number(library?.location.split("|")[0]),
        Number(library?.location.split("|")[1])
      );
    } catch (error) {
      console.log(`Error on showLocationLibrary: `, error);
    }
  }
}
