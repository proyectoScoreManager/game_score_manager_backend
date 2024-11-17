import {SetMetadata} from '@nestjs/common';

export const Roles = (...roles: string []) => {
    console.log('roles del decorador', ...roles);

    return SetMetadata('roles', roles)}
