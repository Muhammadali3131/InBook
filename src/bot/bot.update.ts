import { Context, Markup } from "telegraf";
import { BotService } from "./bot.service";
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from "nestjs-telegraf";
import { TelegrafExceptionFilter } from "../common/filters/telegraf-exception.filter";
import { UseFilters, UseGuards } from "@nestjs/common";
import { AdminGuard } from "../common/guards/admin.guard";
import { ChannelSubscriptionGuard } from "../common/guards/subscribe.guard";

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @UseFilters(TelegrafExceptionFilter)
  @UseGuards(AdminGuard)
  @Command("admin")
  async onAdminCommand(@Ctx() ctx: Context) {
    await this.botService.admin_menu(ctx, `Xush kelibsiz, ADMIN`);
  }

  @UseGuards(ChannelSubscriptionGuard)
  @Start()
  async onStart(@Ctx() ctx: Context) {
    await this.botService.start(ctx);
  }

  @UseGuards(ChannelSubscriptionGuard)
  @Action("subscribed")
  async subscribed(@Ctx() ctx: Context) {
    const contextMessage = ctx.callbackQuery!["message"];
    await ctx.deleteMessage(contextMessage?.message_id);
    this.onStart(ctx);
  }

  @On("contact")
  async onContact(@Ctx() ctx: Context) {
    await this.botService.onContact(ctx);
  }

  @Command("stop")
  async onStop(@Ctx() ctx: Context) {
    await this.botService.onStop(ctx);
  }

  @On("location")
  async onLocation(@Ctx() ctx: Context) {
    await this.botService.onLocation(ctx);
  }

  // @On("photo")
  // async onPhoto(@Ctx() ctx: Context) {
  //   if ("photo" in ctx.message!) {
  //     console.log(ctx.message.photo);
  //     await ctx.replyWithPhoto(
  //       String(ctx.message.photo[ctx.message.photo.length - 1].file_id)
  //     );
  //   }
  // }

  // @On("video")
  // async onVideo(@Ctx() ctx: Context) {
  //   if ("video" in ctx.message!) {
  //     console.log(ctx.message.video);
  //     await ctx.reply(String(ctx.message.video.file_name));
  //   }
  // }

  // @On("sticker")
  // async onSticker(@Ctx() ctx: Context) {
  //   if ("sticker" in ctx.message!) {
  //     console.log(ctx.message.sticker);
  //     await ctx.replyWithSticker(String(ctx.message.sticker.file_id));
  //   }
  // }

  // @On("animation")
  // async onAnimation(@Ctx() ctx: Context) {
  //   if ("animation" in ctx.message!) {
  //     console.log(ctx.message.animation);
  //     await ctx.replyWithAnimation(String(ctx.message.animation.file_id));
  //   }
  // }

  // @On("voice")
  // async onVoice(@Ctx() ctx: Context) {
  //   if ("voice" in ctx.message!) {
  //     console.log(ctx.message.voice);
  //     await ctx.reply(String(ctx.message.voice.duration));
  //   }
  // }

  // @On("document")
  // async onDoc(@Ctx() ctx: Context) {
  //   if ("document" in ctx.message!) {
  //     console.log(ctx.message.document);
  //     await ctx.replyWithDocument(String(ctx.message.document.file_id));
  //   }
  // }

  // @Hears("hi")
  // async onHearsHi(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Heil Hitler");
  // }

  // @Command("help")
  // async onCommandHelp(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Ertaga yordam beraman");
  // }

  // @Command("inline")
  // async onCommandInline(@Ctx() ctx: Context) {
  //   const inlineKeyboards = [
  //     [
  //       {
  //         text: "Product1",
  //         callback_data: "product_1",
  //       },
  //       {
  //         text: "Product2",
  //         callback_data: "product_2",
  //       },
  //       {
  //         text: "Product3",
  //         callback_data: "product_3",
  //       },
  //     ],
  //     [
  //       {
  //         text: "Product4",
  //         callback_data: "product_4",
  //       },
  //       {
  //         text: "Product5",
  //         callback_data: "product_5",
  //       },
  //     ],
  //     [
  //       {
  //         text: "Product6",
  //         callback_data: "product_6",
  //       },
  //     ],
  //   ];

  //   await ctx.reply("Kerakli productni tanla:", {
  //     reply_markup: {
  //       inline_keyboard: inlineKeyboards,
  //     },
  //   });
  // }

  // @Action("product_1")
  // async onActPro1(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Product1 tanlandi");
  // }

  // @Action("product_2")
  // async onActPro2(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Product2 tanlandi");
  // }

  // @Action(/product_\d+/)
  // async onActAnyProduct(@Ctx() ctx: Context) {
  //   if ("data" in ctx.callbackQuery!) {
  //     const data = ctx.callbackQuery?.data;
  //     const productId = data.split("_")[1];
  //     console.log(data);
  //     await ctx.replyWithHTML(`${productId} - product tanlandi`);
  //   }
  // }

  // @Command("main")
  // async onCommandMain(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Kerakli Main Button tanla:", {
  //     ...Markup.keyboard([
  //       ["Bir"],
  //       ["Ikki", "Uch"],
  //       ["To'rt", "Besh", "Olti"],
  //       [Markup.button.contactRequest("Telefon raqamingizni yuboring")],
  //       [Markup.button.locationRequest("Turgan manzilingizni yuboring")],
  //     ])
  //       .resize()
  //       .oneTime(),
  //   });
  // }

  // @Hears("Bir")
  // async onHearsBir(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Bir bosildi");
  // }

  // @Hears("Ikki")
  // async onHearsIkki(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Ikki bosildi");
  // }

  // @Hears("Uch")
  // async onHearsUch(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Uch bosildi");
  // }

  // @Hears("To'rt")
  // async onHearsTort(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("To'rt bosildi");
  // }

  // @Hears("Besh")
  // async onHearsBesh(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Besh bosildi");
  // }

  // @Hears("Olti")
  // async onHearsOlti(@Ctx() ctx: Context) {
  //   await ctx.replyWithHTML("Olti bosildi");
  // }

  @On("text")
  async onText(@Ctx() ctx: Context) {
    await this.botService.onText(ctx);
  }

  @On("message")
  async onMessage(@Ctx() ctx: Context) {
    console.log(ctx.botInfo);
    console.log(ctx.chat);
    console.log(ctx.chat!.id);
    console.log(ctx.from);
    console.log(ctx.from!.id);
  }
}
