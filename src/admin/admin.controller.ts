import {Body, Controller, Get, Post} from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}  

@Get('/getRoles')
getRolres(): Promise<Object> {
    return this.adminService.getRoles();
}
@Post('/setRole')
setRole(@Body() body: Object): Promise<Object> {
    //let w= this.database.getWilayaFromUrl(headers['origin']);
    return this.adminService.setRole(body);
} 

@Post('/setUser')
setUser(@Body() body: Object): Promise<Object> {    
    return this.adminService.setUser(body);       
}
}