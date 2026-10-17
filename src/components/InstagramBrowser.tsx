import { Platform } from 'react-native';
import { InstagramBrowser as WebBrowser } from './InstagramBrowser.web';
import { InstagramBrowser as NativeBrowser } from './InstagramBrowser.native';

export type { InstagramBrowserRef } from './InstagramBrowser.web';

export const InstagramBrowser = Platform.OS === 'web' ? WebBrowser : NativeBrowser;
