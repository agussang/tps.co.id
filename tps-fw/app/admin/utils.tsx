import { getPathname } from "@/utils/pathname";
const w = window as any;

export const isAdmin = () => {
  if (getPathname().startsWith("/backend/tpsadmin")) {
    return true;
  }
  return false;
};
export const renameFile = (file: File) => {
  let result = null;

  const file_name = getRandomFileName(file.name);
  const type_file = file.type;
  const ext_file = file.name.split('.').pop();
  const blob = file.slice(0, file.size, type_file); 
  const new_file = new File([blob], `${file_name}.${ext_file}`, {type: type_file});
  
  result = new_file

  return result;
}

const getRandomFileName = (filename: string) => {
  const timestamp = new Date().toISOString().replace(/[-:.]/g,"");  
  const random = ("" + Math.random()).substring(2, 8); 
  const random_number = timestamp+random;  
  const file_name = getFileNameWithoutExtension(filename);
  return `${file_name.replace(/[%\s]/g, '_')}_${random_number}`;
}

const getFileNameWithoutExtension = (filePath: any) => {
  return filePath.match(/([^/]+)(?=\.[^.]+$)/)[0];
}