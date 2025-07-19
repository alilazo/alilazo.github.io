# HTGDesigns Cost Calculator

A minimalistic web application that calculates printing costs based on image dimensions and cost per square inch.

## Features

- **Drag & Drop Upload**: Easy image upload with drag and drop functionality
- **Aspect Ratio Preservation**: Images maintain their original proportions when resized
- **Real-time Calculations**: Instant cost updates as you adjust image size or cost per square inch
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Minimalistic UI**: Clean black and white design with blue accent colors

## How to Use

1. **Upload Image**: Drag and drop an image or click to browse files
2. **Resize**: Use the slider to adjust the desired print size (max: 13" width × 15" height)
3. **View Cost**: See the calculated printing cost at $0.035 per square inch

## Technical Details

- **Pure HTML/CSS/JavaScript**: No external dependencies
- **Static Website**: Perfect for GitHub Pages hosting
- **Responsive Design**: Mobile-friendly interface
- **Accessibility**: Keyboard navigation and screen reader friendly

## File Structure

```
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── script.js       # JavaScript functionality
└── README.md       # Project documentation
```

## Hosting on GitHub Pages

1. Create a new repository on GitHub
2. Upload all files to the repository
3. Go to Settings > Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Your site will be available at `https://yourusername.github.io/repositoryname`

## Customization

### Colors
The main theme uses:
- **Primary**: Black (#000000) and White (#ffffff)
- **Accent**: Blue (#3498db)
- **Gray tones**: Various shades for backgrounds and text

### Default Settings
- **Cost per square inch**: $0.035 (3.5 cents) - Fixed rate
- **Default image size**: 10 inches
- **Maximum dimensions**: 13" width × 15" height
- **Size range**: 1-50 inches (constrained by maximum dimensions)

## Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

This project is open source and available under the [MIT License](LICENSE).
