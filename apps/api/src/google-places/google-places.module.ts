import { Module } from "@nestjs/common";
import { GooglePlacesController } from "./google-places.controller";
import { GooglePlacesService } from "./google-places.service";

@Module({
  controllers: [GooglePlacesController],
  providers: [GooglePlacesService],
  exports: [GooglePlacesService],
})
export class GooglePlacesModule {}
