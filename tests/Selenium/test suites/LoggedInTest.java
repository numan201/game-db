// Generated by Selenium IDE
import org.junit.Test;
import org.junit.Before;
import org.junit.After;
import static org.junit.Assert.*;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.core.IsNot.not;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.firefox.FirefoxDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.remote.RemoteWebDriver;
import org.openqa.selenium.remote.DesiredCapabilities;
import org.openqa.selenium.Dimension;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.interactions.Actions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.Alert;
import org.openqa.selenium.Keys;
import java.util.*;
import java.net.MalformedURLException;
import java.net.URL;
public class LoggedInTest {
  private WebDriver driver;
  private Map<String, Object> vars;
  JavascriptExecutor js;
  @Before
  public void setUp() {
    driver = new FirefoxDriver();
    js = (JavascriptExecutor) driver;
    vars = new HashMap<String, Object>();
  }
  @After
  public void tearDown() {
    driver.quit();
  }
  @Test
  public void wishlistTabLoggedIn() {
    // Test name: wishlist Tab_(Logged In)
    // Step # | name | target | value
  }
  @Test
  public void wishlistAddThenRemoveFirstGameOnGamesLoggedIn() {
    // Test name: wishlist Add Then Remove First Game On Games_(Logged In)
    // Step # | name | target | value
    // 1 | open | / | 
    driver.get("http://gamedb.us-east-1.elasticbeanstalk.com/");
    // 2 | click | linkText=Games | 
    driver.findElement(By.linkText("Games")).click();
    // 3 | click | css=.card-deck:nth-child(3) > .card:nth-child(1) .card-img-top | 
    driver.findElement(By.cssSelector(".card-deck:nth-child(3) > .card:nth-child(1) .card-img-top")).click();
    // 4 | click | css=.btn-secondary | 
    driver.findElement(By.cssSelector(".btn-secondary")).click();
    // 5 | verifyElementPresent | css=.btn-secondary | 
    {
      List<WebElement> elements = driver.findElements(By.cssSelector(".btn-secondary"));
      assert(elements.size() > 0);
    }
    // 6 | click | linkText=Wishlist | 
    driver.findElement(By.linkText("Wishlist")).click();
    // 7 | click | linkText=Remove | 
    driver.findElement(By.linkText("Remove")).click();
  }
  @Test
  public void clickLogOutButtonLoggedIn() {
    // Test name: click Log Out Button_(Logged In)
    // Step # | name | target | value
    // 1 | open | / | 
    driver.get("http://gamedb.us-east-1.elasticbeanstalk.com/");
    // 2 | setWindowSize | 1280x800 | 
    driver.manage().window().setSize(new Dimension(1280, 800));
    // 3 | click | css=a > .btn | 
    driver.findElement(By.cssSelector("a > .btn")).click();
  }
  @Test
  public void clickAllTabsLoggedIn() {
    // Test name: click All Tabs_(Logged In)
    // Step # | name | target | value
    // 1 | open | / | 
    driver.get("http://gamedb.us-east-1.elasticbeanstalk.com/");
    // 2 | setWindowSize | 973x777 | 
    driver.manage().window().setSize(new Dimension(973, 777));
    // 3 | click | linkText=GameDB | 
    driver.findElement(By.linkText("GameDB")).click();
    // 4 | click | linkText=Home | 
    driver.findElement(By.linkText("Home")).click();
    // 5 | click | linkText=Games | 
    driver.findElement(By.linkText("Games")).click();
    // 6 | click | linkText=Publishers | 
    driver.findElement(By.linkText("Publishers")).click();
    // 7 | click | linkText=Wishlist | 
    driver.findElement(By.linkText("Wishlist")).click();
    // 8 | click | linkText=About | 
    driver.findElement(By.linkText("About")).click();
    // 9 | click | linkText=News | 
    driver.findElement(By.linkText("News")).click();
  }
}
