/**
 * Lab workflow popover shell — shared placement/offset and chrome wrapper.
 */
import type { FC, ReactNode } from 'react';
import { Popover, PopoverFormChrome, type PopoverFormChromeProps } from '@/components/overlays';
import { FooterInfo } from '@/components/display';
import { IconKeys } from '@/config/icons';
import { LAB_CONFIG } from '../constants/labConstants';

interface LabAnchoredPopoverProps {
  trigger: ReactNode;
  preventClose?: boolean;
  children: (ctx: { close: () => void }) => ReactNode;
}

export const LabAnchoredPopover: FC<LabAnchoredPopoverProps> = ({
  trigger,
  preventClose = false,
  children,
}) => (
  <Popover
    placement="bottom-end"
    offsetValue={LAB_CONFIG.POPOVER_OFFSET}
    preventClose={preventClose}
    trigger={trigger}
  >
    {({ close }) => (
      <div data-popover-content onClick={e => e.stopPropagation()}>
        {children({ close })}
      </div>
    )}
  </Popover>
);

type LabFormPopoverChromeProps = Omit<PopoverFormChromeProps, 'footerInfo'> & {
  footerInfo?: ReactNode;
};

export const LabFormPopoverChrome: FC<LabFormPopoverChromeProps> = ({
  footerInfo,
  ...props
}) => (
  <PopoverFormChrome
    {...props}
    footerInfo={
      footerInfo ?? <FooterInfo icon={IconKeys.modules.laboratory} label="Laboratory" />
    }
  />
);
