import bcrypt

def hashear_contrasena(contrasena: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(contrasena.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verificar_contrasena(contrasena: str, hash_guardado: str) -> bool:
    return bcrypt.checkpw(contrasena.encode('utf-8'), hash_guardado.encode('utf-8'))