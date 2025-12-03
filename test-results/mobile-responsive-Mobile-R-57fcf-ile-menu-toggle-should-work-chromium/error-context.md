# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - link [ref=e8] [cursor=pointer]:
        - /url: /
        - img [ref=e10]
      - heading "Sign In" [level=1] [ref=e13]
      - paragraph [ref=e14]: Welcome back to Nexus AI
    - generic [ref=e15]:
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]: Email Address
          - textbox "Email Address" [ref=e19]:
            - /placeholder: you@example.com
            - text: test@example.com
        - generic [ref=e20]:
          - generic [ref=e21]: Password
          - textbox "Password" [active] [ref=e22]:
            - /placeholder: ••••••••
            - text: password123
        - generic [ref=e23]:
          - checkbox "Remember me for 2 weeks" [ref=e24] [cursor=pointer]
          - generic [ref=e25] [cursor=pointer]: Remember me for 2 weeks
        - button "Sign In" [ref=e26] [cursor=pointer]
      - generic [ref=e31]: or
      - generic [ref=e32]:
        - paragraph [ref=e33]: Don't have an account yet?
        - link "Create Free Account" [ref=e34] [cursor=pointer]:
          - /url: /register
      - link "Forgot your password?" [ref=e36] [cursor=pointer]:
        - /url: /password/new
    - link "Back to Home" [ref=e38] [cursor=pointer]:
      - /url: /
      - img [ref=e39]
      - text: Back to Home
```