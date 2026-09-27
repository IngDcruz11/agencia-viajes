import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { UsuarioActual, UsuarioToken } from '../common/decorators/usuario-actual.decorator';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto, RegistroDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/auth/registro
  @Post('registro')
  @HttpCode(201)
  registrar(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  // POST /api/auth/login  -> accessToken + refreshToken
  @Post('login')
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // POST /api/auth/refresh -> nuevo accessToken + nuevo refreshToken
  @Post('refresh')
  @HttpCode(200)
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  // POST /api/auth/logout -> invalida el refreshToken
  @Post('logout')
  @HttpCode(200)
  logout(@Body() dto: RefreshDto) {
    return this.authService.logout(dto.refreshToken);
  }

  // GET /api/auth/perfil (protegida)
  @Get('perfil')
  @UseGuards(JwtAuthGuard)
  perfil(@UsuarioActual() usuario: UsuarioToken) {
    return this.authService.perfil(usuario.sub);
  }
}
