import { Context, Markup } from "telegraf";
import { BotService } from "../bot.service";
import {
  Action,
  Command,
  Ctx,
  Hears,
  On,
  Start,
  Update,
} from "nestjs-telegraf";
import { LibraryService } from "./library.service";

@Update()
export class LibraryUpdate {
  constructor(private readonly libraryService: LibraryService) {}

  @Hears("📚Kutubxona")
  async onHearsLibrary(@Ctx() ctx: Context) {
    await this.libraryService.onLibrary(ctx);
  }

  @Hears("Yangi kutubxona qo'shish")
  async addNewLibrary(@Ctx() ctx: Context) {
    await this.libraryService.addNewLibrary(ctx);
  }

  @Hears("Barcha kutubxonalar")
  async showAllLibraries(@Ctx() ctx: Context) {
    await this.libraryService.showAllLibraries(ctx);
  }

  @Action(/^dellib_+\d+$/)
  async deleteLibrary(@Ctx() ctx: Context) {
    await this.libraryService.deleteLibrary(ctx);
  }

  @Action(/^loclib_+\d+$/)
  async showLocationLibrary(@Ctx() ctx: Context) {
    await this.libraryService.showLocationLibrary(ctx);
  }
}
