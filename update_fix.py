import sys
content = sys.stdin.read()
old = """      if (hasCredentials) {
        const { error } = await supabase
          .from("myfxbook_credentials")
          .update({ email, password, updated_at: new Date().toISOString() })
          .eq("user_id", user!.id);
        if (error) throw error;
      }"""
new = """      if (hasCredentials) {
        const updateData: any = { email: email.trim(), updated_at: new Date().toISOString() };
        if (password.trim()) updateData.password = password.trim();
        const { error } = await supabase
          .from("myfxbook_credentials")
          .update(updateData)
          .eq("user_id", user!.id);
        if (error) throw error;
      }"""
print(content.replace(old, new))
