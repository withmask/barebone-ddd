import { Module } from 'components';

export const userDomainModule = Module.create();

userDomainModule.listen(() => {
  console.log('a');
});
