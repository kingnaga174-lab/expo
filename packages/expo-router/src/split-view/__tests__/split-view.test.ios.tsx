import { act, screen, within } from '@testing-library/react-native';
import { Children, isValidElement, type ReactNode } from 'react';
import { Text, type NativeSyntheticEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { IsWithinNativeNavigator } from '../../exports';
import JSStack from '../../layouts/JSStack';
import Stack from '../../layouts/StackClient';
import { SafeAreaView, Split, StackV5 } from '../../optional-libraries/react-native-screens';
import { renderRouter } from '../../testing-library';
import { Slot } from '../../views/Navigator';
import { SplitView } from '../split-view';

jest.mock('../../optional-libraries/react-native-screens', () => {
  const { View }: typeof import('react-native') = jest.requireActual('react-native');
  const actual = jest.requireActual(
    '../../optional-libraries/react-native-screens'
  ) as typeof import('../../optional-libraries/react-native-screens');

  return {
    ...actual,
    isScreens5: true,
    SafeAreaView: jest.fn(({ children }: { children?: ReactNode }) => (
      <View testID="SafeAreaView">{children}</View>
    )),
    Split: {
      ...actual.Split,
      Host: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Host">{children}</View>
      )),
      Column: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Column">{children}</View>
      )),
      Inspector: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Split.Inspector">{children}</View>
      )),
    },
    StackV5: {
      ...actual.StackV5,
      Host: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Stack.Host">{children}</View>
      )),
      Screen: jest.fn(({ children }: { children?: ReactNode }) => (
        <View testID="Stack.Screen">{children}</View>
      )),
      HeaderConfig: jest.fn(() => null),
    },
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

const SplitLayout = () => (
  <SplitView>
    <SplitView.Column />
  </SplitView>
);
it('renders a SplitView nested under Slot', async () => {
  await renderRouter(
    {
      _layout: () => <Slot />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('renders a SplitView nested under the default navigator', async () => {
  await renderRouter(
    {
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('rejects a SplitView nested under a native navigator', async () => {
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: () => <Stack />,
          'nested/_layout': SplitLayout,
          'nested/index': () => <Text>Child</Text>,
        },
        { initialUrl: '/nested' }
      )
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested under a custom native navigator', async () => {
  await expect(
    async () =>
      await renderRouter(
        {
          _layout: () => (
            <IsWithinNativeNavigator value>
              <Slot />
            </IsWithinNativeNavigator>
          ),
          'nested/_layout': SplitLayout,
          'nested/index': () => <Text>Child</Text>,
        },
        { initialUrl: '/nested' }
      )
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('rejects a SplitView nested inside a SplitView column', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column>
              <SplitLayout />
            </SplitView.Column>
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow('SplitView cannot be used inside another native navigator.');
});

it('renders a SplitView nested under a JavaScript navigator', async () => {
  await renderRouter(
    {
      _layout: () => <JSStack />,
      'nested/_layout': SplitLayout,
      'nested/index': () => <Text testID="child">Child</Text>,
    },
    { initialUrl: '/nested' }
  );

  expect(screen.getByTestId('Split.Host')).toBeVisible();
  expect(screen.getByTestId('child')).toBeVisible();
});

it('passes each SplitView.Column to Split.Host as a direct Split.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The last render of Split.Host has the final children.
  const hostProps = jest.mocked(Split.Host).mock.lastCall![0];
  expect(
    Children.toArray(hostProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([Split.Column, Split.Column]);
});

it('renders a one-screen Stack.Host as the only child of a SplitView.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the content column.
  const columnProps = jest.mocked(Split.Column).mock.calls[0]![0];
  expect(
    Children.toArray(columnProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([StackV5.Host]);
  // The first Stack.Host is in the sidebar column.
  const hostProps = jest.mocked(StackV5.Host).mock.calls[0]![0];
  expect(
    Children.toArray(hostProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([StackV5.Screen]);
});

it('renders the content and Stack.HeaderConfig in the attached Stack.Screen of a SplitView.Column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.Screen is in the sidebar column.
  const screenProps = jest.mocked(StackV5.Screen).mock.calls[0]![0];
  expect(screenProps.activityMode).toBe('attached');
  expect(
    Children.toArray(screenProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView, StackV5.HeaderConfig]);
});

it('wraps SplitView.Column content in a horizontal SafeAreaView around a SafeAreaProvider', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first SafeAreaView is in the sidebar column.
  const safeAreaViewProps = jest.mocked(SafeAreaView).mock.calls[0]![0];
  expect(safeAreaViewProps.edges).toEqual({ left: true, right: true });
  expect(
    Children.toArray(safeAreaViewProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaProvider]);
});

it('renders the route in a one-screen Stack.Host in the content column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text testID="index">Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the content column.
  const contentColumn = screen.getAllByTestId('Split.Column')[1]!;
  expect(
    within(within(contentColumn).getByTestId('Stack.Host')).getByTestId('index')
  ).toBeVisible();
  // The second SafeAreaView is in the content column.
  expect(jest.mocked(SafeAreaView).mock.calls[1]![0].edges).toEqual({ left: true, right: true });
});

it('renders the route as the only child of the content column when stackIntegration is set', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content stackIntegration />
        </SplitView>
      ),
      index: () => <Text testID="index">Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Split.Column is the sidebar column. The second is the content column.
  const contentColumnProps = jest.mocked(Split.Column).mock.calls[1]![0];
  expect(
    Children.toArray(contentColumnProps.children).map(
      (child) => isValidElement(child) && child.type
    )
  ).toEqual([Slot]);
  expect(screen.getByTestId('index')).toBeVisible();
});

it('renders SplitView.Inspector content in a horizontal SafeAreaView without a Stack.Host', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
          <SplitView.Inspector>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const inspectorProps = jest.mocked(Split.Inspector).mock.calls[0]![0];
  expect(
    Children.toArray(inspectorProps.children).map((child) => isValidElement(child) && child.type)
  ).toEqual([SafeAreaView]);
  // The SafeAreaViews are in the sidebar column, the content column, and the inspector.
  expect(jest.mocked(SafeAreaView).mock.calls[2]![0].edges).toEqual({ left: true, right: true });
});

it('removes the horizontal insets when the split view collapses', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The handler only forwards the event, so an empty object is enough.
  const event = {} as NativeSyntheticEvent<Record<string, never>>;
  await act(() => jest.mocked(Split.Host).mock.lastCall![0].onCollapse!(event));

  // The last call is for the content column.
  expect(jest.mocked(SafeAreaView).mock.lastCall![0].edges).toEqual({ left: false, right: false });
});

it('applies the horizontal insets again when the split view expands', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The handlers only forward the event, so an empty object is enough.
  const event = {} as NativeSyntheticEvent<Record<string, never>>;
  await act(() => jest.mocked(Split.Host).mock.lastCall![0].onCollapse!(event));
  await act(() => jest.mocked(Split.Host).mock.lastCall![0].onExpand!(event));

  // The last call is for the content column.
  expect(jest.mocked(SafeAreaView).mock.lastCall![0].edges).toEqual({ left: true, right: true });
});

it('applies the horizontal insets in collapsed mode when horizontalSafeAreaInsets is always', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView horizontalSafeAreaInsets="always">
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The handler only forwards the event, so an empty object is enough.
  const event = {} as NativeSyntheticEvent<Record<string, never>>;
  await act(() => jest.mocked(Split.Host).mock.lastCall![0].onCollapse!(event));

  // The last call is for the content column.
  expect(jest.mocked(SafeAreaView).mock.lastCall![0].edges).toEqual({ left: true, right: true });
});

it('keeps the SafeAreaView without insets in expanded mode when horizontalSafeAreaInsets is never', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView horizontalSafeAreaInsets="never">
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Inspector>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The SafeAreaViews are in the sidebar column, the content column, and the inspector.
  expect(jest.mocked(SafeAreaView).mock.calls[0]![0].edges).toEqual({ left: false, right: false });
  expect(jest.mocked(SafeAreaView).mock.calls[1]![0].edges).toEqual({ left: false, right: false });
  expect(jest.mocked(SafeAreaView).mock.calls[2]![0].edges).toEqual({ left: false, right: false });
});

it('calls onCollapse and onExpand passed to SplitView', async () => {
  const onCollapse = jest.fn();
  const onExpand = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView onCollapse={onCollapse} onExpand={onExpand}>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The handlers only forward the event, so an empty object is enough.
  const event = {} as NativeSyntheticEvent<Record<string, never>>;
  await act(() => jest.mocked(Split.Host).mock.lastCall![0].onCollapse!(event));
  await act(() => jest.mocked(Split.Host).mock.lastCall![0].onExpand!(event));

  expect(onCollapse).toHaveBeenCalledTimes(1);
  expect(onCollapse).toHaveBeenCalledWith(event);
  expect(onExpand).toHaveBeenCalledTimes(1);
  expect(onExpand).toHaveBeenCalledWith(event);
});

it('does not pass horizontalSafeAreaInsets to Split.Host', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView horizontalSafeAreaInsets="never">
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  const hostProps = jest.mocked(Split.Host).mock.lastCall![0];
  expect('horizontalSafeAreaInsets' in hostProps).toBe(false);
});

it('passes the SplitView.Column header to Stack.HeaderConfig', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              title: 'Mailboxes',
              subtitle: '3 unread',
              largeTitle: true,
              leftToolbar: [{ title: 'Edit', onPress: () => {} }],
              rightToolbar: [{ title: 'Search', icon: 'magnifyingglass', onPress: () => {} }],
            }}>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  expect(jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0]).toEqual({
    title: 'Mailboxes',
    subtitle: '3 unread',
    ios: {
      largeTitleEnabled: true,
      leadingItems: [{ type: 'item', id: 'left.0', title: 'Edit', onPress: expect.any(Function) }],
      trailingItems: [
        {
          type: 'item',
          id: 'right.0',
          title: 'Search',
          icon: { type: 'sfSymbol', name: 'magnifyingglass' },
          onPress: expect.any(Function),
        },
      ],
    },
  });
});

it('passes no props to Stack.HeaderConfig for a SplitView.Column without header', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column>
            <Text>Sidebar</Text>
          </SplitView.Column>
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  expect(jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0]).toEqual({});
});

it('passes the title colors of the SplitView.Column header to both header appearances', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              title: 'Inbox',
              titleStyle: { color: 'red' },
              largeTitleStyle: { color: 'blue' },
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  const { ios } = jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0];
  expect(ios).toHaveProperty('standardAppearance', {
    titleFontColor: 'red',
    largeTitleFontColor: 'blue',
  });
  expect(ios).toHaveProperty('scrollEdgeAppearance', {
    titleFontColor: 'red',
    largeTitleFontColor: 'blue',
  });
});

it('uses the title color for the large title when largeTitleStyle has no color', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column header={{ title: 'Inbox', titleStyle: { color: 'red' } }} />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  const { ios } = jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0];
  expect(ios).toHaveProperty('standardAppearance', {
    titleFontColor: 'red',
    largeTitleFontColor: 'red',
  });
});

it('passes the toolbar item menu to Stack.HeaderConfig without the item onPress', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                {
                  title: 'Filter',
                  icon: 'line.3.horizontal.decrease.circle',
                  onPress: () => {},
                  menu: {
                    title: 'Filter by',
                    items: [
                      { title: 'Unread', icon: 'envelope.badge', onPress: () => {} },
                      { title: 'Flagged' },
                    ],
                  },
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  expect(jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0].ios!.trailingItems).toEqual([
    {
      type: 'item',
      id: 'right.0',
      title: 'Filter',
      icon: { type: 'sfSymbol', name: 'line.3.horizontal.decrease.circle' },
      menu: {
        type: 'menu',
        id: 'right.0.menu',
        title: 'Filter by',
        children: [
          {
            type: 'menuItem',
            id: 'right.0.0',
            title: 'Unread',
            icon: { type: 'sfSymbol', name: 'envelope.badge' },
            onPress: expect.any(Function),
          },
          { type: 'menuItem', id: 'right.0.1', title: 'Flagged' },
        ],
      },
    },
  ]);
});

it('calls onPress of the pressed toolbar item', async () => {
  const onEditPress = jest.fn();
  const onArchivePress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                { title: 'Edit', onPress: onEditPress },
                { title: 'Archive', onPress: onArchivePress },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column. The items are inline items, so they have `onPress`.
  const items = jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0].ios!.trailingItems as {
    onPress: () => void;
  }[];
  items[1]!.onPress();

  expect(onArchivePress).toHaveBeenCalledTimes(1);
  expect(onEditPress).not.toHaveBeenCalled();
});

it('calls onPress of the pressed menu action', async () => {
  const onUnreadPress = jest.fn();
  const onFlaggedPress = jest.fn();
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              leftToolbar: [
                {
                  title: 'Filter',
                  menu: {
                    items: [
                      { title: 'Unread', onPress: onUnreadPress },
                      { title: 'Flagged', onPress: onFlaggedPress },
                    ],
                  },
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column. The menu has only menu items, so they have `onPress`.
  const items = jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0].ios!.leadingItems as {
    menu: { children: { onPress: () => void }[] };
  }[];
  items[0]!.menu.children[1]!.onPress();

  expect(onFlaggedPress).toHaveBeenCalledTimes(1);
  expect(onUnreadPress).not.toHaveBeenCalled();
});

it('passes the variant of toolbar items to Stack.HeaderConfig with done as prominent', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                { title: 'Cancel', variant: 'plain' },
                { title: 'Done', variant: 'done' },
                { title: 'Send', variant: 'prominent' },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  expect(jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0].ios!.trailingItems).toEqual([
    { type: 'item', id: 'right.0', title: 'Cancel', variant: 'plain' },
    { type: 'item', id: 'right.1', title: 'Done', variant: 'prominent' },
    { type: 'item', id: 'right.2', title: 'Send', variant: 'prominent' },
  ]);
});

it('passes tintColor, hidesSharedBackground, disabled and an xcasset icon of toolbar items to Stack.HeaderConfig', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              rightToolbar: [
                {
                  title: 'Logo',
                  icon: { xcasset: 'logo' },
                  tintColor: 'red',
                  hidesSharedBackground: true,
                  disabled: true,
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column.
  expect(jest.mocked(StackV5.HeaderConfig).mock.calls[0]![0].ios!.trailingItems).toEqual([
    {
      type: 'item',
      id: 'right.0',
      title: 'Logo',
      icon: { type: 'xcasset', name: 'logo' },
      tintColor: 'red',
      hidesSharedBackground: true,
      disabled: true,
    },
  ]);
});

it('passes the SplitView.Content header to Stack.HeaderConfig in the content column', async () => {
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content header={{ title: 'Message' }} />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The first Stack.HeaderConfig is in the sidebar column. The second is in the content column.
  expect(jest.mocked(StackV5.HeaderConfig).mock.calls[1]![0]).toEqual({
    title: 'Message',
    ios: {},
  });
});

it('warns about header fields that react-native-screens 5 does not support', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column
            header={{
              searchBar: { placeholder: 'Search' },
              backTitle: 'Back',
              rightToolbar: [
                {
                  title: 'Inbox',
                  badge: { value: 3 },
                  selected: true,
                  menu: { items: [{ title: 'Unread', isOn: true }] },
                },
              ],
            }}
          />
          <SplitView.Content />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  expect(warn).toHaveBeenCalledWith(
    'SplitView ignores these header fields, because react-native-screens 5 does not support them: searchBar, backTitle, badge, selected, isOn. Remove them from the SplitView headers.'
  );
  warn.mockRestore();
});

it('does not render the SplitView.Inspector header and warns about it', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content />
          <SplitView.Inspector header={{ title: 'Details' }}>
            <Text>Inspector</Text>
          </SplitView.Inspector>
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The two Stack.HeaderConfig calls are for the sidebar and the content column.
  expect(StackV5.HeaderConfig).toHaveBeenCalledTimes(2);
  expect(warn).toHaveBeenCalledWith(
    'SplitView.Inspector ignores the header prop, because react-native-screens 5 does not support a header in the inspector. Remove header from SplitView.Inspector.'
  );
  warn.mockRestore();
});

it('does not render the SplitView.Content header with stackIntegration and warns about it', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  await renderRouter(
    {
      _layout: () => (
        <SplitView>
          <SplitView.Column />
          <SplitView.Content stackIntegration header={{ title: 'Message' }} />
        </SplitView>
      ),
      index: () => <Text>Index</Text>,
    },
    { initialUrl: '/' }
  );

  // The only Stack.HeaderConfig call is for the sidebar column.
  expect(StackV5.HeaderConfig).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledWith(
    'SplitView.Content ignores the header prop when stackIntegration is set, because the stack of the content route shows the navigation bar. Set the title in the screen options of that stack, or remove stackIntegration.'
  );
  warn.mockRestore();
});

it('rejects two SplitView.Content in a SplitView', async () => {
  await expect(
    async () =>
      await renderRouter({
        _layout: () => (
          <SplitView>
            <SplitView.Column />
            <SplitView.Content />
            <SplitView.Content />
          </SplitView>
        ),
        index: () => <Text>Index</Text>,
      })
  ).rejects.toThrow('There can only be one SplitView.Content in the SplitView.');
});
