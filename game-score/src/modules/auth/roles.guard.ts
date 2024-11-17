import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {

    constructor (private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.get<string[]> ('roles', context.getHandler());
        if(!requiredRoles) {
            return true;
        }

        const {user} = context.switchToHttp().getRequest();
        console.log('Roles del guard:', requiredRoles, 'user', user.roles);

        return requiredRoles.some(role => user.roles?.includes(role))
         
    }
}