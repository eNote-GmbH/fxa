import { Meta } from '@storybook/react';
import HelloWorld from '.';

export default {
  title: 'components/HelloWorld',
  component: HelloWorld,
} as Meta;

export const Default = () => {
  return <HelloWorld />;
};
