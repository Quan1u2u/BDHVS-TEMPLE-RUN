import { Heading, type HeadingProps } from '@chakra-ui/react';

export function GameHeading({ children, ...props }: HeadingProps) {
  return (
    <Heading color="colorPalette.fg" fontFamily="bangers" {...props}>
      {children}
    </Heading>
  );
}
