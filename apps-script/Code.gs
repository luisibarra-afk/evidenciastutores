/**
 * Backend de Evidencias CBTIS 179 (Tutoría ABC de las Emociones + Formación Socioemocional).
 * Recibe un POST en formato JSON desde tutoria.html o formacion-socioemocional.html,
 * guarda las 2 fotos + un .txt de evidencia en Google Drive, y registra una fila
 * en una hoja de cálculo de control. Todo se crea automáticamente la primera vez
 * que se usa: no hay IDs de carpeta ni de hoja que configurar a mano.
 *
 * DESPLIEGUE:
 * 1. https://script.google.com/ → Nuevo proyecto → pega este archivo como Code.gs
 * 2. Implementar → Nueva implementación → tipo "Aplicación web"
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier usuario
 * 3. Autoriza los permisos que pida (Drive y Hojas de cálculo).
 * 4. Copia la URL que termina en /exec y pégala en APPS_SCRIPT_URL
 *    dentro de tutoria.html y formacion-socioemocional.html.
 */

const RAIZ_NOMBRE = 'Evidencias CBTIS 179';
const HOJA_NOMBRE = 'Registro de Evidencias CBTIS 179';

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', mensaje: 'Script de evidencias activo ✓' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    if (!data.foto1 || !data.foto2) {
      throw new Error('Faltan las 2 fotografías.');
    }
    if (!data.fecha) {
      throw new Error('Falta la fecha.');
    }

    let resultado;
    if (data.programa === 'FormacionSocioemocional') {
      resultado = guardarFormacionSocioemocional(data);
    } else {
      resultado = guardarTutoriaABC(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', folderUrl: resultado.folderUrl }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', mensaje: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function guardarTutoriaABC(data) {
  const raiz = getOrCreateFolder(DriveApp.getRootFolder(), RAIZ_NOMBRE);
  const progFolder = getOrCreateFolder(raiz, 'Tutoría ABC de las Emociones');
  const docenteFolder = getOrCreateFolder(progFolder, `${data.tutorNombre} (${data.tutorGrupo})`);
  const fechaFolder = getOrCreateFolder(docenteFolder, data.fecha);

  guardarFotosYTexto(fechaFolder, data.fecha, data.foto1, data.foto2,
    `Tutoría ABC de las Emociones\n` +
    `Docente: ${data.tutorNombre}\n` +
    `Grupo: ${data.tutorGrupo}\n` +
    `Aula: ${data.tutorAula || ''}\n` +
    `Fecha: ${data.fecha}\n` +
    `Título: ${data.titulo || ''}\n\n` +
    `Descripción:\n${data.descripcion || ''}`);

  const hoja = getOrCreateSheet('Tutoria', [
    'Fecha de registro', 'Docente', 'Grupo', 'Aula', 'Fecha de la sesión', 'Título', 'Descripción', 'Carpeta'
  ]);
  hoja.appendRow([
    new Date(), data.tutorNombre, data.tutorGrupo, data.tutorAula || '', data.fecha,
    data.titulo || '', data.descripcion || '', fechaFolder.getUrl()
  ]);

  return { folderUrl: fechaFolder.getUrl() };
}

function guardarFormacionSocioemocional(data) {
  const raiz = getOrCreateFolder(DriveApp.getRootFolder(), RAIZ_NOMBRE);
  const progFolder = getOrCreateFolder(raiz, 'Formación Socioemocional');
  const docenteFolder = getOrCreateFolder(progFolder, `${data.docenteNombre} — ${data.semestre} ${data.ambito} (${data.grupo})`);
  const actividadFolder = getOrCreateFolder(docenteFolder, `Actividad ${data.actividadNumero} - ${data.actividadTitulo}`);

  guardarFotosYTexto(actividadFolder, data.fecha, data.foto1, data.foto2,
    `Formación Socioemocional\n` +
    `Semestre / ámbito: ${data.semestre} - ${data.ambito}\n` +
    `Docente: ${data.docenteNombre}\n` +
    `Grupo: ${data.grupo}\n` +
    `Semana: ${data.semanaLabel || data.fecha}\n` +
    `Actividad ${data.actividadNumero}: ${data.actividadTitulo}\n\n` +
    `Notas:\n${data.descripcion || ''}`);

  const hoja = getOrCreateSheet('FormacionSocioemocional', [
    'Fecha de registro', 'Docente', 'Grupo', 'Semestre', 'Ámbito', 'N° Actividad', 'Actividad',
    'Semana', 'Notas', 'Carpeta'
  ]);
  hoja.appendRow([
    new Date(), data.docenteNombre, data.grupo, data.semestre, data.ambito,
    data.actividadNumero, data.actividadTitulo, data.semanaLabel || data.fecha, data.descripcion || '', actividadFolder.getUrl()
  ]);

  return { folderUrl: actividadFolder.getUrl() };
}

function guardarFotosYTexto(carpeta, fecha, foto1, foto2, textoEvidencia) {
  carpeta.createFile(base64ADataBlob(foto1, `foto1_${fecha}`));
  carpeta.createFile(base64ADataBlob(foto2, `foto2_${fecha}`));
  carpeta.createFile(`evidencia_${fecha}.txt`, textoEvidencia, MimeType.PLAIN_TEXT);
}

function base64ADataBlob(dataUrl, nombreBase) {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.*)$/);
  if (!match) throw new Error('Formato de imagen inválido.');
  const contentType = match[1];
  const base64 = match[2];
  const ext = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1];
  const bytes = Utilities.base64Decode(base64);
  return Utilities.newBlob(bytes, contentType, `${nombreBase}.${ext}`);
}

function getOrCreateFolder(parent, nombre) {
  const existentes = parent.getFoldersByName(nombre);
  if (existentes.hasNext()) return existentes.next();
  return parent.createFolder(nombre);
}

function getOrCreateSheet(nombrePestana, encabezados) {
  const raiz = getOrCreateFolder(DriveApp.getRootFolder(), RAIZ_NOMBRE);
  const archivos = raiz.getFilesByName(HOJA_NOMBRE);
  let ss;
  if (archivos.hasNext()) {
    ss = SpreadsheetApp.open(archivos.next());
  } else {
    ss = SpreadsheetApp.create(HOJA_NOMBRE);
    const archivo = DriveApp.getFileById(ss.getId());
    raiz.addFile(archivo);
    DriveApp.getRootFolder().removeFile(archivo);
  }

  let hoja = ss.getSheetByName(nombrePestana);
  if (!hoja) {
    hoja = ss.insertSheet(nombrePestana);
    hoja.appendRow(encabezados);
    hoja.setFrozenRows(1);
    const hojaDefault = ss.getSheetByName('Hoja 1') || ss.getSheetByName('Sheet1');
    if (hojaDefault && ss.getSheets().length > 1) ss.deleteSheet(hojaDefault);
  }
  return hoja;
}
