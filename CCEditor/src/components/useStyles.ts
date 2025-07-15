import { makeStyles, shorthands, tokens } from "@fluentui/react-components";

export const useStyles = makeStyles({
  root: {
    display: "flex",
    flexDirection: "column",
    // minHeight: "100vh",
    backgroundColor: tokens.colorNeutralBackground2,
    color: tokens.colorNeutralForeground1,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalXXL}`,
    backgroundColor: tokens.colorNeutralBackground3,
    ...shorthands.borderBottom("1px", "solid", tokens.colorNeutralStroke1),
    position: "sticky",
    top: "0",
    zIndex: "100",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalM,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: tokens.spacingHorizontalL,
  },
  appName: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,

    "& small": {
      fontSize: tokens.fontSizeBase300,
      fontWeight: tokens.fontWeightRegular,
    },
  },
  mainContent: {
    padding: tokens.spacingHorizontalXXL,
    flexGrow: "1",
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalXXL,
    overflow: "auto",
  },
  dropArea: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: tokens.spacingHorizontalXXL,
    ...shorthands.border("2px", "dashed", tokens.colorNeutralStrokeAccessible),
    ...shorthands.borderRadius(tokens.borderRadiusLarge),
    textAlign: "center",
    minHeight: "150px",
    backgroundColor: tokens.colorNeutralBackground3,
    cursor: "pointer",
    transitionProperty: "all",
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground3Hover,
      // borderColor: tokens.colorBrandStroke1,
    },
  },
  dropAreaHighlight: {
    backgroundColor: tokens.colorBrandBackground2,
    // borderColor: tokens.colorBrandStroke2Pressed,
  },
  editorLayout: {
    display: "grid",
    gridTemplateColumns: "300px 1fr", // Fixed width for avatar panel
    gap: tokens.spacingHorizontalXXL,
    "@media (max-width: 1000px)": {
      // Adjusted breakpoint
      gridTemplateColumns: "1fr",
    },
    overflow: "hidden",
  },
  avatarPanel: {
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalL,
    alignItems: "center",
    padding: tokens.spacingHorizontalL,
    overflow: "auto",
  },
  avatarImage: {
    width: "100%", // Make avatar responsive within its panel
    maxWidth: "280px", // Max width
    maxHeight: "400px", // Max height
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
    objectFit: "contain",
  },
  formTabsPanel: {
    overflow: "auto",
    // padding: tokens.spacingHorizontalL, // Tab content will have padding
  },
  tabContent: {
    paddingTop: tokens.spacingVerticalL,
  },
  formGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: tokens.spacingHorizontalM,
    "@media (max-width: 700px)": {
      // Adjusted breakpoint for form grid
      gridTemplateColumns: "1fr",
    },
  },
  fullWidth: {
    gridColumn: "1 / -1",
  },
  buttonGroup: {
    display: "flex",
    gap: tokens.spacingHorizontalM,
    justifyContent: "flex-end",
    marginTop: tokens.spacingVerticalL,
  },
  historyDrawerBody: {
    padding: tokens.spacingHorizontalL,
    display: "flex",
    flexDirection: "column",
    gap: tokens.spacingVerticalS,
  },
  historyItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: "pointer",
    ":hover": {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  historyItemName: {
    fontWeight: tokens.fontWeightRegular,
  },
  historyItemDate: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
  },
  readOnlyTextarea: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackgroundDisabled,
    minHeight: "80px",
  },
  fileNameText: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground2,
    textAlign: "center",
    wordBreak: "break-all",
    // marginTop: tokens.spacingVerticalS,
  },
  // Character Book Editor Styles
  bookEntryCard: {
    marginBottom: tokens.spacingVerticalL,
    padding: tokens.spacingHorizontalL,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  bookEntryHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: tokens.spacingVerticalS,
  },
  bookEntryGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
  },
  bookEntryFullWidth: {
    gridColumn: "1 / -1",
  },
  bookActions: {
    marginTop: tokens.spacingVerticalL,
    display: "flex",
    justifyContent: "space-between",
  },
  tips_markdown_body: {
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    // backgroundColor: tokens.colorNeutralBackgroundDisabled,
    minHeight: "80px",
    padding: "8px",
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    ...shorthands.overflow("auto"),

    // 子元素统一样式
    "& p": {
      margin: "8px 0",
      lineHeight: "1.6",
    },

    "& code": {
      fontFamily: tokens.fontFamilyMonospace,
      backgroundColor: tokens.colorNeutralBackground1,
      padding: "2px 4px",
      borderRadius: tokens.borderRadiusSmall,
      fontSize: "90%",
    },

    "& pre": {
      backgroundColor: tokens.colorNeutralBackground1,
      padding: "12px",
      overflowX: "auto",
      ...shorthands.borderRadius(tokens.borderRadiusMedium),
      ...shorthands.border("1px", "solid", tokens.colorNeutralStroke1),
      fontSize: tokens.fontSizeBase200,
      lineHeight: "1.5",
    },

    "& pre code": {
      padding: "0",
      backgroundColor: "transparent",
    },

    "& a": {
      color: tokens.colorBrandForegroundLink,
      textDecoration: "underline",
      ":hover": {
        color: tokens.colorBrandForegroundLinkHover,
      },
    },

    "& ul": {
      paddingLeft: "1.5em",
      margin: "8px 0",
    },

    "& li": {
      margin: "4px 0",
    },

    "& strong": {
      fontWeight: tokens.fontWeightBold,
    },

    "& em": {
      fontStyle: "italic",
    },

    "& blockquote": {
      borderLeft: `4px solid ${tokens.colorNeutralStroke1}`,
      margin: "8px 0",
      paddingLeft: "12px",
      color: tokens.colorNeutralForeground3,
      fontStyle: "italic",
    },

    "& hr": {
      border: "none",
      borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
      margin: "16px 0",
    },
  },
});
