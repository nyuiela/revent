/**
 * Centralized SVG Icons Management
 * Similar to Flutter's AppIcons, this file contains all SVG icon paths
 * Usage: import { AppIcons } from '@/lib/appIcons'
 * Example: <Image src={AppIcons.logo} alt="Logo" />
*/

export const AppIcons = {
  // Navigation & UI Icons
  logo: "/svg/logo.svg",
  homeActive: "/svg/home.svg",
  homeInactive: "/svg/homeInactive.svg",
  home1: "/svg/home1.svg",
  homebg: "/svg/homebg.svg",
  sidebarLeft: "/svg/sidebar-left.svg",
  gridView: "/svg/grid-view.svg",
  list: "/svg/list.svg",
  marketInactive: "/svg/filter.svg",
  marketActive: "/svg/frame.svg",
  filters: "/svg/filters.svg",
  betInactive: "/svg/bet.svg",
  betActive: "/svg/frame1.svg",
  search: "/svg/search.svg",
  gameInactive: "/svg/game.svg",
  gameActive: "/svg/gameActive.svg",
  walletInactive: "/svg/wallet.svg",
  walletActive: "/svg/mail-active.svg",
  refresh: "/svg/refresh.svg",
  
  // User & Account Icons
  user: "/svg/user.svg",
  profile: "/svg/profile-user.svg",
  addUser: "/svg/add-user.svg",
  gamer: "/svg/gamer.svg",
  
  // Wallet & Finance Icons
  wallet: "/svg/wallet.svg",
  wallet05: "/svg/wallet-05.svg",
  addWallet: "/svg/add-wallet.svg",
  dollar: "/svg/dollar.svg",
  coins: "/svg/coins.svg",
  deposit: "/svg/deposit.svg",
  withdraw: "/svg/withdraw.svg",

  // Cryptocurrency Icons
  eth: "/svg/eth.svg",
  bnb: "/svg/bnb.svg",
  usdc: "/svg/usdc.svg",
  usdt: "/svg/usdt.svg",
  blockchain: "/svg/blockchain.svg",

  // Action Icons
  addCircle: "/svg/add-circle.svg",
  plusSign: "/svg/plus-sign.svg",
  cancelCircle: "/svg/cancel-circle.svg",
  checkmark: "/svg/checkmark.svg",
  checkmarkCircle: "/svg/checkmark-circle.svg",
  createBet: "/svg/create-bet.svg",
  informationCircle: "/svg/information-circle.svg",
  calendar: "/svg/calendar.svg",
  userLock: "/svg/user-lock.svg",
  copy: "/svg/copy.svg",
  stake: "/svg/stake.svg",

  // Arrow Icons
  arrowUp: "/svg/arrow-down.svg",
  arrowDown: "/svg/arrow-down1.svg",
  arrowRight: "/svg/arrow-right.svg",
  chevronDown: "/svg/chevron-down.svg",

  // Communication Icons
  bubbleChat: "/svg/bubble-chat.svg",
  mailActive: "/svg/mail-active.svg",
  share: "/svg/share1.svg",

  // Game & Competition Icons
  fire: "/svg/fire.svg",
  magic: "/svg/magic.svg",
  smiley: "/svg/smiley.svg",

  // Analytics & Charts
  analytics: "/svg/analytics.svg",
  chartUp: "/svg/chart-up.svg",

  // Time & Status Icons
  timer: "/svg/timer.svg",
  hourglass: "/svg/hourglass.svg",
  trophy: "/svg/trophy.svg",

  // Legend & Node Icons
  legendNode: "/svg/LegendNode.svg",
  legendNode1: "/svg/LegendNode1.svg",
  legendNode2: "/svg/LegendNode2.svg",
  legendNode3: "/svg/LegendNode3.svg",

  // Gift & Rewards
  giftInactive: "/svg/gift.svg",
  giftActive: "/svg/gift-active.svg",

  // Background & Decorative
  bg: "/svg/bg.svg",

  // Document & File Icons
  file: "/svg/file.svg",
  earnInactive: "/svg/invoice.svg",
  transactionHistory: "/svg/transaction-history.svg",

  // Points Icons
  dollarCoin: "/svg/dollar-coin.svg",
  rival: "/svg/rival.svg",
  oracle: "/svg/oracle.svg",
  champion: "/svg/champ.svg",
  challenger: "/svg/challenge.svg",
  ranks: "/svg/ranks.svg",
  greenBet: "/svg/green-bets.svg",
  winRate: "/svg/win-rate.svg",
  blueWallet: "/svg/blue-wallet.svg",
  polygon: "/svg/polygon.svg",
  polygonWhite: "/svg/polygon-white.svg",
} as const;

// Type for icon keys to ensure type safety
export type AppIconKey = keyof typeof AppIcons;

/**
 * Helper function to get icon path with type safety
 * @param iconName - The name of the icon
 * @returns The path to the SVG icon
 */
export const getIcon = (iconName: AppIconKey): string => {
  return AppIcons[iconName];
};

/**
 * Helper function to/**
 * Check if an icon exists in the AppIcons object
 * @param iconName - The icon name to check
 * @returns boolean indicating if the icon exists
 */
export const hasIcon = (iconName: string): iconName is AppIconKey => {
  return iconName in AppIcons;
};

/**
 * Get an icon with custom color by creating a data URL with modified SVG
 * @param iconName - The icon name from AppIcons
 * @param color - The color to apply (hex, rgb, or named color)
 * @returns Promise<string> - Data URL of the colored SVG
 */
export const getColoredIcon = async (
  iconName: AppIconKey,
  color: string
): Promise<string> => {
  try {
    const response = await fetch(AppIcons[iconName]);
    const svgText = await response.text();

    // Replace stroke and fill colors in the SVG
    const coloredSvg = svgText
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
      .replace(/fill="[^"]*"/g, `fill="${color}"`);

    // Create data URL
    const dataUrl = `data:image/svg+xml;base64,${btoa(coloredSvg)}`;
    return dataUrl;
  } catch (error) {
    console.error("Error creating colored icon:", error);
    return AppIcons[iconName]; // Fallback to original
  }
};

/**
 * Create a colored version of an SVG icon synchronously using CSS filter
 * @param iconName - The icon name from AppIcons
 * @param color - The color to apply
 * @returns object with src and style for Image component
 */
export const getIconWithColor = (iconName: AppIconKey, color: string) => {
  // Convert hex color to CSS filter for black
  const getFilterForColor = (hexColor: string) => {
    if (
      hexColor.toLowerCase() === "#000000" ||
      hexColor.toLowerCase() === "black"
    ) {
      return "brightness(0) saturate(100%)";
    }
    // For other colors, return empty filter (use original color)
    return "";
  };

  return {
    src: AppIcons[iconName],
    style: {
      filter: getFilterForColor(color),
    },
  };
};
