# Compilador Autómatas 2 (sin rutinas)

### NOTA: El analizador solo toma en cuenta la parte semántica, por lo que el analizador no reconocerá errores sintácticos. Asegurese de comprobar que la sintaxis es correcta antes de proceder.

La lógica principal de la aplicación se encuentra en:
src/app/features/compiler/compiler.component.ts

Puedes ver y usar la aplicación en el siguiente enlace: https://main.d2e9t5rqow1p22.amplifyapp.com/

## 🛠️ Instalación

### Requisitos previos
Antes de comenzar, asegúrate de tener instalado:

- Node.js (versión recomendada: >=18.x)
- npm (normalmente viene con Node.js)
- Angular CLI (versión global)

Puedes instalar Angular CLI desde el cmd:

#### npm install -g @angular/cli

## Cómo levantar el proyecto

1. Clona este repositorio

#### git clone https://github.com/Samuel-Rodriguez28/AnalizadorAutomatas2.git
#### cd AnalizadorAutomatas2
   
2. Instala las dependencias

#### npm install

4. Corre la aplicación en modo desarrollo

#### ng serve

5. Abre tu navegador en: http://localhost:4200

## Cómo funciona

En esta sección puedes escribir el código que deseas analizar y ejecutar.
También puedes usar el botón "Abrir" para cargar un archivo de texto desde tu equipo. 
El contenido de ese archivo se insertará automáticamente en el área de texto.

![image](https://github.com/user-attachments/assets/ebd77b46-d8ac-4bb4-a486-fefe40f43115)

En esta sección de la interfaz se mostrarán 3 botones.

"Analizar" separa los componentes léxicos encontrados en el area de texto.

"Construir" tomará todos los tokens encontrados en area de texto y procederá a construir el Vector de Código Intermedio (VCI).

"Ejecutar" Ejecutará las instrucciones encontradas en el VCI.

### NOTA: El analizador requiere que los 3 botones se presionen en orden una vez que un proceso se haya completado, de lo contrario la aplicación puede presentar comportamientos inesperados.

![image](https://github.com/user-attachments/assets/c67244c6-2d7a-494e-bf20-5c71a0ecabf8)

En esta sección de la interfaz se encuentra un switch para escoger si quiere que los procesos se ejecuten sin pausas o si prefiere escoger un intervalo de segundos para ver la construcción del proceso paso a paso.

![image](https://github.com/user-attachments/assets/094d7257-b3de-4cf6-9bd1-c1c5e4b08276)

![image](https://github.com/user-attachments/assets/77224ccc-a80f-4ea7-aaf2-7dac97b872ec)


