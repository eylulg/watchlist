import { screen } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';

/** Opens a library Select and picks an option, the way a user does. */
export const chooseOption = async (user: UserEvent, trigger: HTMLElement, option: string) => {
  await user.click(trigger);
  await user.click(await screen.findByRole('option', { name: option }));
};
