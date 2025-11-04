import json

# Load data
with open("url_mock_data.json", "r") as f:
    data = json.load(f)

# Define the viridis-like colorscale
colorscale = [
    (0/11, "#fde725"),
    (1/11, "#c2df23"),
    (2/11, "#86d549"),
    (3/11, "#52c569"),
    (4/11, "#2ab07f"),
    (5/11, "#1e9b8a"),
    (6/11, "#25858e"),
    (7/11, "#2d708e"),
    (8/11, "#38588c"),
    (9/11, "#433e85"),
    (10/11, "#482173"),
    (11/11, "#440154"),
]

def hex_to_rgb(hexcolor):
    hexcolor = hexcolor.lstrip("#")
    return tuple(int(hexcolor[i:i+2], 16) for i in (0, 2, 4))

def rgb_to_hex(rgb):
    return "#{:02x}{:02x}{:02x}".format(*rgb)

def interpolate_color(c1, c2, t):
    """Interpolate between two RGB colors"""
    return tuple(int(a + (b - a) * t) for a, b in zip(c1, c2))

def get_color(level):
    # Handle invalid values
    if level is None or not isinstance(level, (int, float)):
        return "#e9e9e9"
    
    # Clamp between 0–1
    level = max(0, min(1, level))

    # Find interval in colorscale
    for i in range(len(colorscale) - 1):
        start, color1 = colorscale[i]
        end, color2 = colorscale[i + 1]
        if start <= level <= end:
            ratio = (level - start) / (end - start)
            rgb = interpolate_color(hex_to_rgb(color1), hex_to_rgb(color2), ratio)
            return rgb_to_hex(rgb)
    return "#e9e9e9"

# Apply to all rows
for row in data:
    val = row.get("Overeducation")
    row["hex"] = get_color(val) if val is not None else "#e9e9e9"

# Save updated file
with open("url_mock_data_with_hex.json", "w") as f:
    json.dump(data, f, indent=2)

print("✅ Added hex colors and saved to url_mock_data_with_hex.json")

