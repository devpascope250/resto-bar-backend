import { Menu, MenuButton, MenuItems, MenuItem } from '@headlessui/react';
import { EllipsisVerticalIcon, TrashIcon, PencilIcon, EyeIcon, } from '@heroicons/react/24/outline';
import { JSX, useLayoutEffect, useRef, useState } from 'react';

interface DropdownActionsProps {
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  customActions?: [
    {
      label: string;
      icon: JSX.Element;
      onClick: () => void;
    }
  ]
}

export const DropdownActions = ({ 
  onDelete, 
  onEdit, 
  onView,
  customActions
}: DropdownActionsProps) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [placement, setPlacement] = useState<'bottom-end' | 'top-end'>('bottom-end');

  useLayoutEffect(() => {
    const calculatePosition = () => {
      if (buttonRef.current) {
        const buttonRect = buttonRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - buttonRect.bottom;
        const dropdownHeight = 144; // Approximate height
        
        // Check if dropdown would go off screen
        const shouldFlipVertical = spaceBelow < dropdownHeight;
        setPlacement(shouldFlipVertical ? 'top-end' : 'bottom-end');
      }
    };

    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    window.addEventListener('scroll', calculatePosition, true);
    
    return () => {
      window.removeEventListener('resize', calculatePosition);
      window.removeEventListener('scroll', calculatePosition, true);
    };
  }, []);

  return (
    <Menu as="div" className="relative inline-block text-left z-[1000]">
      <MenuButton 
        ref={buttonRef}
        className="p-1 rounded hover:bg-gray-100 focus:outline-none cursor-pointer"
        aria-label="Actions"
      >
        <EllipsisVerticalIcon className="h-5 w-5 text-gray-500 cursor-pointer" />
      </MenuButton>

      <MenuItems
        anchor="bottom end"
        className={`absolute z-[1000] w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
          placement === 'bottom-end' ? 'mt-1' : 'mb-1'
        }`}
      >
        <div className="py-1">
          {onView && (
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={onView}
                  className={` cursor-pointer flex w-full items-center px-4 py-2 text-sm ${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  }`}
                >
                  <EyeIcon className="mr-3 h-5 w-5 text-gray-400 cursor-pointer" />
                  View
                </button>
              )}
            </MenuItem>
          )}
          {
            onEdit &&
            <MenuItem>
            {({ active }) => (
              <button
                onClick={onEdit}
                className={`cursor-pointer flex w-full items-center px-4 py-2 text-sm ${
                  active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                }`}
              >
                <PencilIcon className="cursor-pointer mr-3 h-5 w-5 text-gray-400" />
                Edit
              </button>
            )}
          </MenuItem>
          }
          

          {
            onDelete&&
            <MenuItem>
            {({ active }) => (
              <button
                onClick={onDelete}
                className={`cursor-pointer flex w-full items-center px-4 py-2 text-sm ${
                  active ? 'bg-gray-100 text-gray-900' : 'text-red-600'
                }`}
              >
                <TrashIcon className="cursor-pointer mr-3 h-5 w-5 text-red-400" />
                Delete
              </button>
            )}
          </MenuItem>
          }
          
          {
            customActions?.map((action, index) => (
              <MenuItem key={index}>
                {({ active }) => (
                  <button
                    onClick={action.onClick}
                    className={`cursor-pointer flex w-full items-center px-4 py-2 text-sm ${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    }`}
                  >
                    {action.icon}
                    {action.label}
                  </button>
                )}
              </MenuItem>
            ))
          }
        </div>
      </MenuItems>
    </Menu>
  );
};