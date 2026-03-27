import urllib.parse
import os

def generate_atlas_url():
    print("--- MongoDB Atlas URL Generator ---")
    print("This will help you create a correctly encoded connection string.\n")
    
    username = input("Enter Atlas Username: ")
    password = input("Enter Atlas Password: ")
    cluster_url = input("Enter Cluster URL (e.g., freecluster.cpgb3mk.mongodb.net): ")
    db_name = input("Enter Database Name [can_ids]: ") or "can_ids"
    
    # URL encode username and password
    safe_username = urllib.parse.quote_plus(username)
    safe_password = urllib.parse.quote_plus(password)
    
    # Construct the URL
    atlas_url = f"mongodb+srv://{safe_username}:{safe_password}@{cluster_url}/{db_name}?retryWrites=true&w=majority"
    
    print("\n--- YOUR ENCODED URL ---")
    print(atlas_url)
    print("\n------------------------")
    
    confirm = input("Would you like to update your backend/.env with this URL? (y/n): ")
    if confirm.lower() == 'y':
        env_path = os.path.join(os.getcwd(), '.env')
        if not os.path.exists(env_path):
            # Try parent if in a subfolder
            env_path = os.path.join(os.path.dirname(os.getcwd()), '.env')
            
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                lines = f.readlines()
            
            with open(env_path, 'w') as f:
                found = False
                for line in lines:
                    if line.startswith('MONGODB_URL='):
                        f.write(f'MONGODB_URL={atlas_url}\n')
                        found = True
                    else:
                        f.write(line)
                if not found:
                    f.write(f'MONGODB_URL={atlas_url}\n')
            print(f"✅ Successfully updated {env_path}")
        else:
            print("❌ Could not find .env file to update.")

if __name__ == "__main__":
    generate_atlas_url()
