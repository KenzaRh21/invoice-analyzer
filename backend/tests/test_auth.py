def test_register_and_login(client):
    email = "newuser@enterprise.com"
    pwd = "SecurePassword2026!"
    
    # 1. Register
    reg_res = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Audit Manager"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == email

    # 2. Duplicate registration rejected
    dup_res = client.post("/api/auth/register", json={
        "email": email,
        "password": pwd,
        "full_name": "Audit Manager Duplicate"
    })
    assert dup_res.status_code == 400

    # 3. Login
    login_res = client.post("/api/auth/login", json={
        "email": email,
        "password": pwd
    })
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # 4. Get Current User /me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email
