-- =========================================
-- CREAR BASE DE DATOS
-- =========================================

CREATE DATABASE sistema_login;

USE sistema_login;

-- =========================================
-- TABLA ADMINISTRADOR
-- =========================================

CREATE TABLE administrador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    nombre VARCHAR(100) NOT NULL,
    
    correo VARCHAR(120) NOT NULL UNIQUE,
    
    password VARCHAR(255) NOT NULL,
    
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =========================================
-- TABLA USUARIOS
-- =========================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    administrador_id INT NOT NULL,
    
    usuario VARCHAR(50) NOT NULL UNIQUE,
    
    correo VARCHAR(120) DEFAULT NULL,
    
    password VARCHAR(255) NOT NULL,
    
    otp_code VARCHAR(6),
    
    otp_expiracion DATETIME,
    
    admin_otp_completado TINYINT(1) NOT NULL DEFAULT 0,
    
    face_descriptor LONGTEXT NULL,
    
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- FOREIGN KEY
    CONSTRAINT fk_usuario_admin
    FOREIGN KEY (administrador_id)
    REFERENCES administrador(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================
-- TABLA STOCK
-- =========================================

CREATE TABLE stock (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    administrador_id INT NOT NULL,
    
    nombre_producto VARCHAR(150) NOT NULL,
    
    categoria VARCHAR(100) NOT NULL,
    
    marca VARCHAR(100) NOT NULL,
    
    precio DECIMAL(10,2) NOT NULL,
    
    cantidad INT NOT NULL,
    
    descripcion TEXT,
    
    fecha_ingreso DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- FOREIGN KEY
    CONSTRAINT fk_stock_admin
    FOREIGN KEY (administrador_id)
    REFERENCES administrador(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE
);

-- =========================================
-- TABLA LOGS
-- =========================================

CREATE TABLE accesos_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    usuario_id INT NULL,
    
    tipo_evento VARCHAR(50) NOT NULL,
    
    detalle VARCHAR(255) NULL,
    
    ip VARCHAR(64) NULL,
    
    creado DATETIME DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_creado (creado),
    INDEX idx_tipo (tipo_evento)
);

-- =========================================
-- INSERTAR ADMINISTRADOR
-- =========================================

INSERT INTO administrador (
    nombre,
    correo,
    password
)
VALUES (
    'Jherson Apaza',
    'apazajherson@gmail.com',
    'jherson123'
);

-- =========================================
-- INSERTAR USUARIO
-- =========================================

INSERT INTO usuarios (
    administrador_id,
    usuario,
    correo,
    password,
    admin_otp_completado
)
VALUES (
    1,
    'jherson',
    'apazajherson@gmail.com',
    'jherson123',
    0
);

-- =========================================
-- INSERTAR PRODUCTOS TECNOLOGICOS
-- =========================================

INSERT INTO stock (
    administrador_id,
    nombre_producto,
    categoria,
    marca,
    precio,
    cantidad,
    descripcion
)
VALUES

(1, 'Laptop Gamer RTX 4060', 'Laptops', 'ASUS', 4899.90, 8,
 'Laptop gamer con Intel i7 y RTX 4060'),

(1, 'iPhone 15 Pro', 'Celulares', 'Apple', 5999.90, 12,
 'iPhone de última generación'),

(1, 'Samsung Galaxy S24', 'Celulares', 'Samsung', 4299.90, 15,
 'Smartphone Android premium'),

(1, 'Mouse Logitech G502', 'Accesorios', 'Logitech', 249.90, 30,
 'Mouse gamer RGB'),

(1, 'Teclado Mecánico K552', 'Accesorios', 'Redragon', 199.90, 20,
 'Teclado mecánico RGB'),

(1, 'Monitor Curvo 27', 'Monitores', 'Samsung', 1199.90, 10,
 'Monitor Full HD 144Hz'),

(1, 'Audífonos HyperX Cloud II', 'Audio', 'HyperX', 349.90, 18,
 'Audífonos gamer'),

(1, 'PlayStation 5', 'Consolas', 'Sony', 2999.90, 6,
 'Consola PS5'),

(1, 'Disco SSD 1TB', 'Almacenamiento', 'Samsung', 429.90, 25,
 'SSD NVMe ultra rápido'),

(1, 'Router WiFi 6', 'Redes', 'TP-Link', 329.90, 16,
 'Router alta velocidad');