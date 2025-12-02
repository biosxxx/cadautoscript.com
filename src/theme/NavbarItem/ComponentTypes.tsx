import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes';
import type {ComponentTypesObject} from '@theme/NavbarItem/ComponentTypes';
import CustomSearchNavbarItem from './CustomSearch';

const customComponentTypes: ComponentTypesObject = {
  ...ComponentTypes,
  'custom-search': CustomSearchNavbarItem,
};

export default customComponentTypes;
