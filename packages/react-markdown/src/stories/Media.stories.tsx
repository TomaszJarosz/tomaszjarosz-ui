import type { Meta, StoryObj } from '@storybook/react-vite';
import { LinkComponent, ImageComponent } from '../media';

// Link Component
const linkMeta: Meta<typeof LinkComponent> = {
  title: 'Media/LinkComponent',
  component: LinkComponent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default linkMeta;
type LinkStory = StoryObj<typeof LinkComponent>;

export const ExternalLink: LinkStory = {
  args: {
    href: 'https://github.com',
    children: 'Visit GitHub',
  },
};

export const InternalLink: LinkStory = {
  args: {
    href: '/blog/article-slug',
    children: 'Read the article',
    internalPatterns: ['/blog/', '#'],
  },
};

export const AnchorLink: LinkStory = {
  args: {
    href: '#section-id',
    children: 'Jump to section',
  },
};

export const CustomInternalPatterns: LinkStory = {
  args: {
    href: '/docs/getting-started',
    children: 'Documentation',
    internalPatterns: ['/blog/', '/docs/', '#'],
  },
};

// Image Component
const imageMeta: Meta<typeof ImageComponent> = {
  title: 'Media/ImageComponent',
  component: ImageComponent,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export const BasicImage: StoryObj<typeof ImageComponent> = {
  args: {
    src: 'https://picsum.photos/800/400',
    alt: 'A beautiful landscape photo',
    showCaption: true,
  },
};

export const ImageWithoutCaption: StoryObj<typeof ImageComponent> = {
  args: {
    src: 'https://picsum.photos/800/400',
    alt: 'Photo without visible caption',
    showCaption: false,
  },
};

export const BrokenImage: StoryObj<typeof ImageComponent> = {
  args: {
    src: 'https://invalid-url-that-does-not-exist.com/image.jpg',
    alt: 'This image failed to load',
  },
};
