import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  H1, H2, H3, H4, H5, H6,
  UnorderedList, OrderedList, ListItem,
  Table, TableHeader, TableCell, TableRow, TableHead, TableBody,
  BlockquoteComponent,
  Strong, Emphasis, HorizontalRule, Strikethrough,
} from '../typography';

// Headings
const headingsMeta: Meta<typeof H1> = {
  title: 'Typography/Headings',
  component: H1,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default headingsMeta;

export const AllHeadings: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <H1 id="h1-example">Heading 1 (H1)</H1>
      <H2 id="h2-example">Heading 2 (H2)</H2>
      <H3 id="h3-example">Heading 3 (H3)</H3>
      <H4 id="h4-example">Heading 4 (H4)</H4>
      <H5 id="h5-example">Heading 5 (H5)</H5>
      <H6 id="h6-example">Heading 6 (H6)</H6>
    </div>
  ),
};

export const HeadingWithAnchor: StoryObj<typeof H2> = {
  render: () => (
    <div>
      <p className="text-sm text-gray-500 mb-4">Hover over the heading to see the anchor link:</p>
      <H2 id="anchor-example" showAnchor={true}>
        Heading with Anchor Link
      </H2>
    </div>
  ),
};

// Lists
export const Lists: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-2">Unordered List</h3>
        <UnorderedList>
          <ListItem>First item</ListItem>
          <ListItem>Second item</ListItem>
          <ListItem>Third item</ListItem>
        </UnorderedList>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-2">Ordered List</h3>
        <OrderedList>
          <ListItem>First step</ListItem>
          <ListItem>Second step</ListItem>
          <ListItem>Third step</ListItem>
        </OrderedList>
      </div>
    </div>
  ),
};

// Table
export const TableExample: StoryObj = {
  render: () => (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeader>Name</TableHeader>
          <TableHeader>Type</TableHeader>
          <TableHeader>Description</TableHeader>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>id</TableCell>
          <TableCell>number</TableCell>
          <TableCell>Unique identifier</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>name</TableCell>
          <TableCell>string</TableCell>
          <TableCell>User's display name</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>email</TableCell>
          <TableCell>string</TableCell>
          <TableCell>User's email address</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};

// Blockquote
export const Blockquote: StoryObj<typeof BlockquoteComponent> = {
  render: () => (
    <BlockquoteComponent>
      "The best way to predict the future is to invent it." — Alan Kay
    </BlockquoteComponent>
  ),
};

// Inline Elements
export const InlineElements: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <p>
        This is <Strong>bold text</Strong> in a sentence.
      </p>
      <p>
        This is <Emphasis>italic text</Emphasis> in a sentence.
      </p>
      <p>
        This is <Strikethrough>strikethrough text</Strikethrough> in a sentence.
      </p>
      <p>
        Combining: <Strong><Emphasis>bold and italic</Emphasis></Strong>
      </p>
      <div>
        <p className="mb-2">Horizontal rule below:</p>
        <HorizontalRule />
        <p className="mt-2">Content after the rule.</p>
      </div>
    </div>
  ),
};
