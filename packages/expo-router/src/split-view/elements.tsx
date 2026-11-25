import type { ReactNode } from 'react';
import type { ColorValue, NativeSyntheticEvent } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { SFSymbol } from 'sf-symbols-typescript';

import { SafeAreaView, Split, StackV5 } from '../optional-libraries/react-native-screens';
import { toHeaderConfigProps } from './header';

export interface SplitViewToolbarItem {
  /**
   * Title of the button. When `icon` is set, it is used as the accessibility label.
   */
  title: string;
  /**
   * SF Symbol or Xcode asset catalog image shown instead of the title.
   */
  icon?: SFSymbol | { xcasset: string };
  /**
   * Controls how the `xcasset` icon is rendered.
   *
   * - `'template'`: applies the tint color to the icon
   * - `'original'`: preserves the original colors of the icon
   *
   * @default 'template' when `tintColor` is set, otherwise 'original'
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  iconRenderingMode?: 'template' | 'original';
  tintColor?: ColorValue;
  /**
   * Badge shown on the button. Without `value`, the badge is a dot.
   * @platform ios 26+
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  badge?: {
    value?: string | number;
    style?: {
      color?: ColorValue;
      backgroundColor?: ColorValue;
      fontFamily?: string;
      fontSize?: number;
      fontWeight?: string;
    };
  };
  /**
   * @default 'plain'
   */
  variant?: 'plain' | 'done' | 'prominent';
  /**
   * Whether the button has its own background instead of sharing it with the adjacent buttons.
   * @platform ios 26+
   * @default false
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  separateBackground?: boolean;
  /**
   * Whether the background of the button is hidden.
   * @platform ios 26+
   * @default false
   */
  hidesSharedBackground?: boolean;
  /**
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  accessibilityLabel?: string;
  /**
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  accessibilityHint?: string;
  /**
   * Called when the button is pressed. Not called when `menu` is set.
   */
  onPress?: () => void;
  /**
   * Menu that opens when the button is pressed.
   */
  menu?: SplitViewMenu;
  /**
   * Whether the button cannot be pressed.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether the button is in a selected state.
   *
   * @see [Apple documentation](https://developer.apple.com/documentation/uikit/uibarbuttonitem/isselected) for more information
   * @default false
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  selected?: boolean;
}

export interface SplitViewMenu {
  /**
   * Title shown at the top of the menu.
   */
  title?: string;
  /**
   * Actions shown in the menu.
   */
  items: SplitViewMenuAction[];
}

export interface SplitViewMenuAction {
  /**
   * Title of the action.
   */
  title: string;
  /**
   * SF Symbol shown next to the title.
   */
  icon?: SFSymbol;
  /**
   * Called when the action is pressed.
   */
  onPress?: () => void;
  /**
   * Whether the action is shown as destructive.
   * @default false
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  destructive?: boolean;
  /**
   * Whether the action cannot be pressed.
   * @default false
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  disabled?: boolean;
  /**
   * Whether the action shows a checkmark.
   * @default false
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  isOn?: boolean;
}

export interface SplitViewSearchBar {
  /**
   * Text shown in the search field when it is empty.
   */
  placeholder?: string;
  /**
   * Called when the text in the search field changes.
   */
  onChangeText?: (event: NativeSyntheticEvent<{ text: string }>) => void;
  /**
   * Called when the search button on the keyboard is pressed.
   */
  onSearchButtonPress?: (event: NativeSyntheticEvent<{ text: string }>) => void;
}

export interface SplitViewHeader {
  /**
   * Title shown in the navigation bar of the column.
   */
  title?: string;
  /**
   * Subtitle shown below the title.
   * @platform ios 26+
   */
  subtitle?: string;
  /**
   * Whether the navigation bar of the column shows a large title.
   * @default false
   */
  largeTitle?: boolean;
  /**
   * Style of the title in the navigation bar.
   */
  titleStyle?: { color?: ColorValue };
  /**
   * Style of the large title, shown when `largeTitle` is `true`.
   * When `color` is not set, the large title uses the `titleStyle` color.
   */
  largeTitleStyle?: { color?: ColorValue };
  /**
   * Buttons shown on the leading side of the navigation bar.
   */
  leftToolbar?: SplitViewToolbarItem[];
  /**
   * Buttons shown on the trailing side of the navigation bar.
   */
  rightToolbar?: SplitViewToolbarItem[];
  /**
   * Search bar shown in the navigation bar.
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  searchBar?: SplitViewSearchBar;
  /**
   * Title of the back button. Defaults to the title of the previous column.
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  backTitle?: string;
  /**
   * Whether the back button is visible.
   * @default true
   * @deprecated react-native-screens 5 does not support it. SplitView ignores it and logs a warning.
   */
  backVisible?: boolean;
}

export interface SplitViewColumnProps {
  children?: React.ReactNode;
  /**
   * Navigation bar of the column.
   * @platform ios
   */
  header?: SplitViewHeader;
}

export function SplitViewColumn(props: SplitViewColumnProps) {
  return <Split.Column>{getSplitColumnChildren(props)}</Split.Column>;
}

export interface SplitViewContentProps {
  /**
   * Navigation bar of the content column, which renders the current route.
   * Ignored when `stackIntegration` is set.
   * @platform ios
   */
  header?: SplitViewHeader;
  /**
   * Whether the route is the only child of the content column. When the layout of the route renders an
   * `ExperimentalStack` as its root, the stack then navigates the column, and its header is the navigation bar of
   * the column. A stack that is not the root of the route is not shown.
   *
   * The column then does not apply the horizontal safe area insets.
   * @default false
   * @platform ios
   */
  stackIntegration?: boolean;
}

/**
 * Configures the content column of the SplitView. The column renders the current route.
 */
export function SplitViewContent(_props: SplitViewContentProps) {
  return null;
}

/**
 * Split.Column integrates with a Stack.Host that is its only child: the header of the stack is the navigation bar
 * of the column. So the column content is rendered in a stack with one screen.
 * @hidden
 */
export function getSplitColumnChildren(
  { children, header }: SplitViewColumnProps,
  horizontalSafeAreaInsets = false
) {
  return (
    <StackV5.Host>
      <StackV5.Screen activityMode="attached" screenKey="split-view-column">
        {getSafeAreaChildren(children, horizontalSafeAreaInsets)}
        <StackV5.HeaderConfig {...toHeaderConfigProps(header)} />
      </StackV5.Screen>
    </StackV5.Host>
  );
}

/**
 * @hidden
 */
export function getSafeAreaChildren(children: ReactNode, horizontalSafeAreaInsets = false) {
  // The SafeAreaView is always rendered, so that the content is not remounted when the insets change.
  // The provider is inside the SafeAreaView, so `useSafeAreaInsets` does not report the applied horizontal insets again.
  return (
    <SafeAreaView edges={{ left: horizontalSafeAreaInsets, right: horizontalSafeAreaInsets }}>
      <SafeAreaProvider>{children}</SafeAreaProvider>
    </SafeAreaView>
  );
}

/**
 * @platform iOS 26+
 */
export function SplitViewInspector({ children }: SplitViewColumnProps) {
  return <Split.Inspector>{children}</Split.Inspector>;
}
