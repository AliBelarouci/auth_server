import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const whitelistedSites = process.env.WHITELISTED_SITES;
  const whitelist = whitelistedSites.split(',');
app.enableCors({
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1 || process.env.DEV_MODE ) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
 
});
const port:string=process.env.AUTH_PORT
console.log(`========================= the AUTH SERVER listen to the port : ${(port == undefined)? 3000:port} ==============================`)
await app.listen((port == undefined)? 3000:port);
}
bootstrap();
