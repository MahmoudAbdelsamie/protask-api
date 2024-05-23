const nodemailer = require("nodemailer");
const ejs = require("ejs");
const fs = require("fs");
require("dotenv").config();

const emailInit = async (type, sender, receiver, dynamicData) => {
  return new Promise(async (resolve, reject) => {
    let temp;
    switch (type) {
      case "invite":
        temp = "email_template.ejs";
        break;
      case "reset":
        temp = "reset_pass_template.ejs";
        break;
      default:
        break;
    }
    const emailTemplate = fs.readFileSync(
      `${process.cwd()}/middlewares/${temp}`,
      "utf-8"
    );
    let transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.SERVER_PORT,
      secure: true,
      auth: {
        user: process.env.AUTH_USER,
        pass: process.env.AUTH_PASS,
      },
      pool: true,
    });

    const renderedHtml = ejs.render(emailTemplate, dynamicData);
    try {
      let info = await transporter.sendMail({
        from: sender,
        to: receiver, 
        subject: dynamicData.subject,
        text: dynamicData.message, 
        html: renderedHtml, 
      });

      console.log("Success, your message id is:", info.messageId);
      resolve(info); 
    } catch (error) {
      reject(error); 
    }
  });
};

exports.sendEmail = async (type, email, dynamicData) => {
  let info = {};
  try {
    info = await emailInit(type, process.env.AUTH_USER, email, dynamicData);
    console.log("infooo ", info.accepted);
    return info;
  } catch (error) {
    if (error.message == "No recipients defined") {
      return (info.rejected = email);
    }
    throw new Error(`Failed to send email to: ${error.message}`);
  }
};
