import FormData from 'form-data';
import userModel from '../models/UserModel.js';
import axios from 'axios';

export const generateImage = async (req, res) => {
  try {
    const { userId, prompt } = req.body;

    const user = await userModel.findById(userId);

    // Check if the user exists and prompt is provided
    if (!user || !prompt) {
      return res.status(400).json({
        success: false,
        message: 'Missing Details',
      });
    }

    // Check if the user has sufficient credit balance
    if (user.creditBalance <= 0) {
      return res.json({
        success: false,
        message: 'No Credit Balance',
        creditBalance: user.creditBalance,
      });
    }

    // Prepare data for the image generation request
    const formData = new FormData();
    formData.append('prompt', prompt);

    // Call the external API to generate the image
    const { data } = await axios.post(
      'https://clipdrop-api.co/text-to-image/v1',
      formData,
      {
        headers: {
          'x-api-key': process.env.CLIPDROP_API,
        },
        responseType: 'arraybuffer',
      }
    );

    // Convert the binary data to base64 format
    const base64Image = Buffer.from(data, 'binary').toString('base64');
    const resultImage = `data:image/png;base64,${base64Image}`;

    // Deduct credit balance from the user
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        creditBalance: user.creditBalance - 1,
      },
      { new: true }
    );

    // Send the response back with the generated image and updated credit balance
    res.json({
      success: true,
      message: 'Image Generated',
      creditBalance: updatedUser.creditBalance,
      resultImage,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
