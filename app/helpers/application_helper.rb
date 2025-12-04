module ApplicationHelper
  def lucide_icon(name, options = {})
    classes = options[:class] || ""
    content_tag(:i, "", class: "lucide lucide-#{name} #{classes}", data: { lucide: name })
  end

  def markdown(text)
    return "" if text.blank?

    # Security: filter_html removes HTML tags to prevent XSS attacks
    options = {
      filter_html: true,
      hard_wrap: true,
      space_after_headers: true
    }

    extensions = {
      autolink: true,
      fenced_code_blocks: true,
      lax_spacing: true,
      no_intra_emphasis: true,
      strikethrough: true,
      superscript: true
    }

    renderer = Redcarpet::Render::HTML.new(options)
    markdown = Redcarpet::Markdown.new(renderer, extensions)

    markdown.render(text).html_safe
  end
end
