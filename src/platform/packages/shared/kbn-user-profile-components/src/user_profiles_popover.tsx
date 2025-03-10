/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import type { EuiContextMenuPanelProps, EuiPopoverProps } from '@elastic/eui';
import { EuiContextMenuPanel, EuiPopover, useGeneratedHtmlId } from '@elastic/eui';
import React from 'react';

import type { UserProfileWithAvatar } from './user_avatar';
import type { UserProfilesSelectableProps } from './user_profiles_selectable';
import { UserProfilesSelectable } from './user_profiles_selectable';

/**
 * Props of {@link UserProfilesPopover} component
 */
export interface UserProfilesPopoverProps<Option extends UserProfileWithAvatar | null>
  extends EuiPopoverProps {
  /**
   * Title of the popover
   * @see EuiContextMenuPanelProps
   */
  title?: EuiContextMenuPanelProps['title'];

  /**
   * Props forwarded to selectable component
   * @see UserProfilesSelectableProps
   */
  selectableProps: UserProfilesSelectableProps<Option>;
}

/**
 * Renders a selectable component inside a popover given a list of user profiles
 */
export const UserProfilesPopover = <Option extends UserProfileWithAvatar | null>({
  title,
  selectableProps,
  ...popoverProps
}: UserProfilesPopoverProps<Option>) => {
  const searchInputId = useGeneratedHtmlId({
    prefix: 'searchInput',
    conditionalId: selectableProps.searchInputId,
  });

  return (
    <EuiPopover panelPaddingSize="none" initialFocus={`[id="${searchInputId}"]`} {...popoverProps}>
      <EuiContextMenuPanel title={title}>
        <UserProfilesSelectable {...selectableProps} searchInputId={searchInputId} />
      </EuiContextMenuPanel>
    </EuiPopover>
  );
};
