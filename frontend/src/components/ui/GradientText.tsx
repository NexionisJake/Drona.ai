import React from 'react';

interface GradientTextProps {
    children: React.ReactNode;
    colors?: string[];
    animationSpeed?: number;
    showBorder?: boolean;
    className?: string;
}

const GradientText: React.FC<GradientTextProps> = ({
    children,
    colors = ["#5227FF", "#FF9FFC", "#B19EEF"],
    animationSpeed = 8,
    showBorder = false,
    className = "",
}) => {
    // Build gradient from colors, repeating first color at end for smooth loop
    const gradientColors = [...colors, colors[0]].join(", ");

    const style: React.CSSProperties = {
        backgroundImage: `linear-gradient(90deg, ${gradientColors})`,
        backgroundSize: "300% 100%",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: `gradient-shift ${animationSpeed}s ease-in-out infinite`,
    };

    const borderStyle: React.CSSProperties = showBorder
        ? {
            borderImage: `linear-gradient(90deg, ${gradientColors}) 1`,
            borderWidth: "1px",
            borderStyle: "solid",
            backgroundSize: "300% 100%",
            animation: `gradient-shift ${animationSpeed}s ease-in-out infinite`,
        }
        : {};

    return (
        <span
            className={className}
            style={{ ...style, ...borderStyle }}
        >
            {children}
        </span>
    );
};

export default GradientText;
