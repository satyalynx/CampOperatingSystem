from seed import seed_database

def reset_db():
    print("Resetting CampOS to complete official demo state...")
    seed_database()
    print("[SUCCESS] CampOS database reset complete.")

if __name__ == "__main__":
    reset_db()
