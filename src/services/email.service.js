import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN,
    },

});


transporter.verify((error,success)=> {
    if (error){
        console.error('Error connecting the email server:',error);
    }
    
    else{
        console.log('Email server is ready to send message');
    }
      
});

const sendEmail = async (to, subject, text, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Dummy Services" <${process.env.EMAIL_USER}>`, 
      to, 
      subject,
      text, 
      html,
    });

    console.log('Message sent: %s', info.messageId);
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};


const sendRegistrationEmail = async (userEmail, name) =>
{
    const subject ="Welcome On board !"
    const text =`Welcome ${name},\n Thank you from registering .\n Best regards\n Dummy Team`;
    const html = `<p>Welcome ${name},</p><p>Thank you for registering.</p><p>Best regards, Dummy Team</p>`

    await sendEmail(userEmail ,subject ,text ,html);
}



export {transporter,sendRegistrationEmail};