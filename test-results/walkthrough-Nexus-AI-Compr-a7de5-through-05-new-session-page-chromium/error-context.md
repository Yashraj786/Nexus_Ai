# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]: Invalid Email or password.
  - main [ref=e4]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - img [ref=e10]
        - heading "Nexus AI" [level=2] [ref=e12]
        - paragraph [ref=e13]: Cyberpunk Intelligence Interface
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e17]:
            - generic [ref=e18]: "* Email Address"
            - textbox "* Email Address" [active] [ref=e19]:
              - /placeholder: your@email.com
              - text: test@example.com
          - generic [ref=e21]:
            - generic [ref=e22]: "* Password"
            - textbox "* Password" [ref=e23]:
              - /placeholder: ••••••••
          - generic [ref=e26]:
            - checkbox "Remember me" [ref=e27]
            - text: Remember me
          - button "SIGN IN" [ref=e28]
        - generic [ref=e30]: or
        - generic [ref=e31]:
          - paragraph [ref=e32]: New to Nexus AI?
          - link "Create Account" [ref=e33] [cursor=pointer]:
            - /url: /register
      - link "← Back to Home" [ref=e34] [cursor=pointer]:
        - /url: /
```