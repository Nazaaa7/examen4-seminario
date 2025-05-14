
import express from 'express'; 
import cors from 'cors'; 
import nodemailer from 'nodemailer'; 
import multer from 'multer'; 
import path from 'path'; 
import { fileURLToPath } from 'url'; 
import fs from 'fs';  

// fix para los módulos ES y __dirname
const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);  

const app = express(); 
const PORT = process.env.PORT || 3000;  

// middleware para configurar cors y permitir peticiones json y urlencoded
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));  

// configuración de multer para subir archivos
const storage = multer.diskStorage({   
  destination: (req, file, cb) => {     
    cb(null, 'uploads/');   
  },   
  filename: (req, file, cb) => {     
    cb(null, Date.now() + path.extname(file.originalname));   
  } 
});

// verificación del tamaño del archivo (limite de 5MB)
const fileFilter = (req, file, cb) => {   
  const fileSize = parseInt(req.headers['content-length']);   
  if (fileSize > 5 * 1024 * 1024) {     
    return cb(new Error('El archivo no debe superar los 5MB'), false);   
  }   
  cb(null, true); 
};  

const upload = multer({    
  storage: storage,   
  fileFilter: fileFilter,   
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB en bytes 
});  

// verificar y crear el directorio 'uploads' si no existe
if (!fs.existsSync('uploads')) {   
  fs.mkdirSync('uploads'); 
}  

// configuración del transporter de nodemailer
const transporter = nodemailer.createTransport({   
  host: 'smtp.gmail.com',   
  port: 465,   
  secure: true,   
  auth: {     
    user: 'nazagarcia132@gmail.com', // correo de Gmail configurado   
    pass: 'rsuwxtfpoxutcber'    // contraseña de aplicación de 16 caracteres de Google   
  } 
});  

// ruta API para enviar correos electrónicos
app.post('/api/send-email', upload.single('attachment'), async (req, res) => {   
  try {     
    const { to, subject, message } = req.body;          

    if (!to || !subject || !message) {       
      return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });     
    }          

    // opciones del correo
    const mailOptions = {   
      from: 'nazagarcia132@gmail.com', // mismo correo configurado arriba   
      to: to,   
      subject: subject,   
      text: message,   
    };          

    // agregar archivo adjunto si se subió un archivo
    if (req.file) {       
      mailOptions.attachments = [         
        {           
          filename: req.file.originalname,           
          path: req.file.path         
        }       
      ];     
    }          

    // enviar el correo
    await transporter.sendMail(mailOptions);          

    // limpiar - eliminar el archivo subido después de enviar el correo
    if (req.file) {       
      fs.unlinkSync(req.file.path);     
    }          

    res.status(200).json({ success: true, message: 'Correo enviado exitosamente' });   
  } catch (error) {     
    console.error('Error al enviar el correo:', error);     
    res.status(500).json({ success: false, message: 'Error al enviar el correo' });   
  } 
});  

// servir archivos estáticos desde el directorio frontend
app.use(express.static(path.join(__dirname, '../frontend')));  

// iniciar el servidor
app.listen(PORT, () => {   
  console.log(`Servidor corriendo en http://localhost:${PORT}`); 
});
