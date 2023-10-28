from PIL import Image

# Open the image to be converted
im = Image.open("input_image.png")

# Convert the image to JPEG format
rgb_im = im.convert("RGB")

# Save the converted image
rgb_im.save("output_image.jpg")