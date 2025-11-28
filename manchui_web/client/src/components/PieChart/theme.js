const customTheme = {
  pie: {
    style: {
      parent: {
        backgroundColor: "#FFFFFF",
      },
      data: {
        padding: 0,
        stroke: "none",
        strokeWidth: 0,
      },

      labels: {
        fontFamily:
          "'Inter', 'Helvetica Neue', 'Seravek', 'Helvetica', sans-serif",
        fontSize: 16,
        fontWeight: 300,
        letterSpacing: "normal",
        padding: 13,
        fill: "#000000",
        stroke: "transparent",
      },
    },
    colorScale: ["var(--brand-red)", "var(--box-1)"],
    cornerRadius: 1,
    width: 450,
    height: 300,
    padding: 60,
  },
};

export default customTheme;
