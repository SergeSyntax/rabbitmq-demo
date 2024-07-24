const convertIDtoBindingKey = (id: string, replicaNum: number) => {
  const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

  return hash % replicaNum;
};

export const generateBindingKey = (id: string, exchangeName: string, replicaNum: number) => {
  const key = convertIDtoBindingKey(id, replicaNum);
  return `${exchangeName}.${key}`;
};
