# Page snapshot

```yaml
- main [ref=e3]:
  - generic [ref=e6]:
    - generic [ref=e7]:
      - link [ref=e8] [cursor=pointer]:
        - /url: /
        - img [ref=e10]
      - heading "Sign In" [level=1] [ref=e15]
      - paragraph [ref=e16]: Welcome back to Nexus AI
    - generic [ref=e17]:
      - generic [ref=e18]:
        - generic [ref=e19]:
          - generic [ref=e20]: Email Address
          - textbox "Email Address" [ref=e21]:
            - /placeholder: you@example.com
            - text: test@example.com
        - generic [ref=e22]:
          - generic [ref=e23]: Password
          - textbox "Password" [active] [ref=e24]:
            - /placeholder: ••••••••
            - text: password123
        - generic [ref=e25]:
          - checkbox "Remember me for 2 weeks" [ref=e26] [cursor=pointer]
          - generic [ref=e27] [cursor=pointer]: Remember me for 2 weeks
        - button "Sign In" [ref=e28] [cursor=pointer]
      - generic [ref=e33]: or
      - generic [ref=e34]:
        - paragraph [ref=e35]: Don't have an account yet?
        - link "Create Free Account" [ref=e36] [cursor=pointer]:
          - /url: /register
      - link "Forgot your password?" [ref=e38] [cursor=pointer]:
        - /url: /password/new
    - link "Back to Home" [ref=e40] [cursor=pointer]:
      - /url: /
      - img [ref=e41]
      - text: Back to Home
```