import type { ComponentProps } from 'react';

import type { StackV5 } from '../optional-libraries/react-native-screens';
import type { SplitViewHeader, SplitViewToolbarItem } from './elements';

type StackHeaderConfigProps = ComponentProps<typeof StackV5.HeaderConfig>;
type HeaderItems = NonNullable<StackHeaderConfigProps['ios']>['leadingItems'];

export function toHeaderConfigProps(header: SplitViewHeader | undefined) {
  if (!header) {
    return {};
  }
  const { title, subtitle, largeTitle, titleStyle, largeTitleStyle, leftToolbar, rightToolbar } =
    header;
  const appearance = (titleStyle?.color !== undefined || largeTitleStyle?.color !== undefined) && {
    titleFontColor: titleStyle?.color,
    largeTitleFontColor: largeTitleStyle?.color ?? titleStyle?.color,
  };
  return {
    title,
    subtitle,
    ios: {
      largeTitleEnabled: largeTitle,
      leadingItems: toHeaderItems('left', leftToolbar),
      trailingItems: toHeaderItems('right', rightToolbar),
      standardAppearance: appearance || undefined,
      scrollEdgeAppearance: appearance || undefined,
    },
  };
}

function toHeaderItems(
  side: 'left' | 'right',
  items: SplitViewToolbarItem[] | undefined
): HeaderItems {
  return items?.map(
    (
      { title, icon, tintColor, variant, hidesSharedBackground, disabled, onPress, menu },
      index
    ) => ({
      type: 'item',
      id: `${side}.${index}`,
      title,
      icon: toIcon(icon),
      tintColor,
      variant: variant === 'done' ? 'prominent' : variant,
      hidesSharedBackground,
      disabled,
      // With `onPress`, only a long press opens the menu. A press must open it, so `onPress` is dropped.
      onPress: menu ? undefined : onPress,
      menu: menu && {
        type: 'menu',
        id: `${side}.${index}.menu`,
        title: menu.title,
        children: menu.items.map((action, actionIndex) => ({
          type: 'menuItem',
          id: `${side}.${index}.${actionIndex}`,
          title: action.title,
          icon: toIcon(action.icon),
          onPress: action.onPress,
        })),
      },
    })
  );
}

function toIcon(icon: SplitViewToolbarItem['icon']) {
  if (icon === undefined) {
    return undefined;
  }
  return typeof icon === 'string'
    ? { type: 'sfSymbol' as const, name: icon }
    : { type: 'xcasset' as const, name: icon.xcasset };
}

const UNSUPPORTED_HEADER_FIELDS = ['searchBar', 'backTitle', 'backVisible'] as const;
const UNSUPPORTED_TOOLBAR_ITEM_FIELDS = [
  'badge',
  'selected',
  'separateBackground',
  'iconRenderingMode',
  'accessibilityLabel',
  'accessibilityHint',
] as const;
const UNSUPPORTED_MENU_ACTION_FIELDS = ['destructive', 'disabled', 'isOn'] as const;

/**
 * Returns the names of the header fields that `Stack.HeaderConfig` of react-native-screens 5 cannot show.
 */
export function getUnsupportedHeaderFields(headers: (SplitViewHeader | undefined)[]) {
  const fields = new Set<string>();
  for (const header of headers) {
    if (!header) continue;
    UNSUPPORTED_HEADER_FIELDS.filter((field) => header[field] !== undefined).forEach((field) =>
      fields.add(field)
    );
    for (const item of [...(header.leftToolbar ?? []), ...(header.rightToolbar ?? [])]) {
      UNSUPPORTED_TOOLBAR_ITEM_FIELDS.filter((field) => item[field] !== undefined).forEach(
        (field) => fields.add(field)
      );
      for (const action of item.menu?.items ?? []) {
        UNSUPPORTED_MENU_ACTION_FIELDS.filter((field) => action[field] !== undefined).forEach(
          (field) => fields.add(field)
        );
      }
    }
  }
  return [...fields];
}
